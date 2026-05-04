import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "./env.js";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
const adapter = new PrismaPg({
  connectionString: env.DATABASE_URL,
  ssl: env.DATABASE_URL.includes("supabase.co") ? { rejectUnauthorized: false } : undefined
});

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
