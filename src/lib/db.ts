import fs from "node:fs";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Timeweb Cloud DBaaS маршрутизирует TLS по домену (SNI) и требует свой корневой
// сертификат для полной проверки цепочки — см. вкладку «Подключение» базы.
const CA_PATH = path.join(process.cwd(), "prisma/certs/timeweb-ca.crt");

function createClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL не задан (см. .env / переменные окружения приложения)",
    );
  }

  const caFromEnv = process.env.DATABASE_CA_CERT;
  const caFromFile = fs.existsSync(CA_PATH)
    ? fs.readFileSync(CA_PATH, "utf8")
    : undefined;
  const ca = caFromEnv || caFromFile;

  // Временная диагностика: помогает понять, почему TLS-подключение к БД
  // падает с "self-signed certificate" в проде (см. чат с деплоем на Timeweb).
  console.log(
    `[db] cwd=${process.cwd()} caPath=${CA_PATH} caFileExists=${fs.existsSync(CA_PATH)} ` +
      `caFromEnv=${Boolean(caFromEnv)} caLength=${ca?.length ?? 0}`,
  );

  const adapter = new PrismaPg({
    connectionString,
    ssl: ca ? { ca, rejectUnauthorized: true } : undefined,
  });
  return new PrismaClient({ adapter });
}

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
