import path from "node:path";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/**
 * SQLite через libsql-адаптер (локальная разработка).
 * Переход на PostgreSQL: см. README → «Миграция на PostgreSQL»
 * (`@prisma/adapter-pg` + provider = "postgresql").
 */
function createClient() {
  const raw = process.env.DATABASE_URL ?? "file:./dev.db";
  const filePath = raw.replace(/^file:/, "");
  const url = path.isAbsolute(filePath)
    ? `file:${filePath}`
    : `file:${path.join(/* turbopackIgnore: true */ process.cwd(), filePath)}`;

  const adapter = new PrismaLibSql({ url });
  return new PrismaClient({ adapter });
}

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
