import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import net from "node:net";
import tls from "node:tls";
import crypto from "node:crypto";

/**
 * ВРЕМЕННЫЙ диагностический роут (Phase: расследование self-signed TLS
 * ошибки при подключении к БД). Подключается к Postgres по TCP,
 * выполняет SSLRequest-преамбулу и смотрит, какой сертификат реально
 * отдаёт сервер, независимо от доверенных CA.
 *
 * УДАЛИТЬ после диагностики — открывает наружу host/port БД и цепочку
 * сертификатов (не секретно, но не должно жить в проде постоянно).
 */

function sslRequestHandshake(host: string, port: number): Promise<net.Socket> {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host, port });
    const timer = setTimeout(() => {
      socket.destroy();
      reject(new Error("TCP/SSLRequest timeout"));
    }, 10000);

    socket.on("connect", () => {
      const req = Buffer.alloc(8);
      req.writeInt32BE(8, 0);
      req.writeInt32BE(80877103, 4);
      socket.write(req);
    });

    socket.once("data", (chunk) => {
      clearTimeout(timer);
      const code = chunk.toString("utf8");
      if (code !== "S") {
        socket.destroy();
        reject(new Error(`Server replied '${code}', expected 'S'`));
        return;
      }
      resolve(socket);
    });

    socket.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

function describeCert(cert: tls.PeerCertificate) {
  return {
    subject: cert.subject,
    issuer: cert.issuer,
    valid_from: cert.valid_from,
    valid_to: cert.valid_to,
    fingerprint256: cert.fingerprint256,
    selfSigned:
      JSON.stringify(cert.subject) === JSON.stringify(cert.issuer),
  };
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  if (url.searchParams.get("secret") !== process.env.AUTH_SECRET) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return NextResponse.json({ error: "no DATABASE_URL" }, { status: 500 });
  }
  const dbUrl = new URL(connectionString);
  const host = dbUrl.hostname;
  const port = Number(dbUrl.port || 5432);

  const CA_PATH = path.join(process.cwd(), "prisma/certs/timeweb-ca.crt");
  const caContent =
    process.env.DATABASE_CA_CERT ||
    (fs.existsSync(CA_PATH) ? fs.readFileSync(CA_PATH, "utf8") : undefined);
  const localCaFingerprint = caContent
    ? crypto
        .createHash("sha256")
        .update(new crypto.X509Certificate(caContent).raw)
        .digest("hex")
        .toUpperCase()
        .replace(/(.{2})(?=.)/g, "$1:")
    : null;

  const result: Record<string, unknown> = { host, port, localCaFingerprint };

  // --- Attempt 1: inspect real chain, ignore trust ---
  try {
    const rawSocket = await sslRequestHandshake(host, port);
    const secure = await new Promise<tls.TLSSocket>((resolve, reject) => {
      const s = tls.connect(
        { socket: rawSocket, servername: host, rejectUnauthorized: false },
        () => resolve(s),
      );
      s.on("error", reject);
    });

    const chain: ReturnType<typeof describeCert>[] = [];
    let current: tls.PeerCertificate | undefined = secure.getPeerCertificate(true);
    const seen = new Set<string>();
    while (current && Object.keys(current).length && !seen.has(current.fingerprint256)) {
      seen.add(current.fingerprint256);
      chain.push(describeCert(current));
      current = current.issuerCertificate;
    }
    result.observedChain = chain;
    result.observedAuthorized = secure.authorized;
    result.observedAuthorizationError = secure.authorizationError;
    secure.destroy();
  } catch (err) {
    result.observedChainError = err instanceof Error ? err.message : String(err);
  }

  // --- Attempt 2: real strict check with our ca (mirrors app config) ---
  if (caContent) {
    try {
      const rawSocket2 = await sslRequestHandshake(host, port);
      const secure2 = await new Promise<tls.TLSSocket>((resolve, reject) => {
        const s = tls.connect(
          {
            socket: rawSocket2,
            servername: host,
            ca: caContent,
            rejectUnauthorized: true,
          },
          () => resolve(s),
        );
        s.on("error", (e) => reject(e));
      });
      result.strictCheck = { success: true, authorized: secure2.authorized };
      secure2.destroy();
    } catch (err) {
      result.strictCheck = {
        success: false,
        error: err instanceof Error ? err.message : String(err),
        code: (err as NodeJS.ErrnoException)?.code,
      };
    }
  }

  return NextResponse.json(result);
}
