import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import crypto from "crypto";
import type { User } from "@prisma/client";
import { getPrismaClient } from "./prisma";

export const SESSION_COOKIE = "crypthunt_session";
const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7; // 7 days

export function createSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Hash a raw session token with SHA-256 before storing in the database.
 * The cookie holds the raw 64-char hex token; the DB holds only the hash.
 * A full database dump cannot be used to forge session cookies.
 */
export function hashSessionToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_MAX_AGE_SEC,
};

export function attachSessionCookie(response: NextResponse, token: string): NextResponse {
  response.cookies.set(SESSION_COOKIE, token, cookieOptions);
  return response;
}

export function clearSessionCookieOnResponse(response: NextResponse): NextResponse {
  response.cookies.set(SESSION_COOKIE, "", { ...cookieOptions, maxAge: 0 });
  return response;
}

export async function getSessionTokenFromCookies(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value ?? null;
}

export async function getAuthenticatedUser(): Promise<User | null> {
  const raw = await getSessionTokenFromCookies();
  if (!raw || raw.length !== 64 || !/^[0-9a-f]+$/.test(raw)) return null;

  const prisma = getPrismaClient();
  if (!prisma) return null;

  // DB stores the SHA-256 hash of the raw token, not the raw token itself
  return prisma.user.findFirst({ where: { sessionToken: hashSessionToken(raw) } });
}

export function checkIsLocked(createdAt: Date): boolean {
  const now = new Date();
  const lockCutoffTime = new Date("2026-06-05T00:30:00+05:30");

  if (createdAt < lockCutoffTime) {
    return false;
  }

  const lockStartTime = new Date("2026-06-07T23:00:00+05:30");
  const lockEndTime = new Date("2026-06-08T01:00:00+05:30");

  return now >= lockStartTime && now < lockEndTime;
}

export function getLockErrorMessage(createdAt: Date): string {
  return "WEBSITE UNDER CONSTRUCTION. PLEASE RELAX. SEE YOU AT 1:00 AM IST.";
}

/** Safe user fields to send to the client — never includes password or sessionToken. */
export function toPublicUser(user: User) {
  return {
    username: user.username,
    email: user.email,
    score: user.score,
    currentLevel: user.currentLevel,
    currentQuestion: user.currentQuestion,
    elapsedTime: user.elapsedTime,
    completedAt: user.completedAt?.toISOString() ?? null,
    updatedAt: user.updatedAt.toISOString(),
    levelCompletePending: user.levelCompletePending,
    createdAt: user.createdAt.toISOString(),
    isLocked: checkIsLocked(user.createdAt),
  };
}
