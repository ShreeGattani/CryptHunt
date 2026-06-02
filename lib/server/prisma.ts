import { PrismaClient } from "@prisma/client";

let prisma: PrismaClient | null = null;

/** Singleton Prisma client. Never hardcodes a fallback DATABASE_URL. */
export function getPrismaClient(): PrismaClient | null {
  if (!process.env.DATABASE_URL) {
    return null;
  }
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}

export function requirePrismaClient(): PrismaClient {
  const client = getPrismaClient();
  if (!client) {
    throw new Error("DATABASE_URL is not configured.");
  }
  return client;
}
