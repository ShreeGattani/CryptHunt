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
  const token = await getSessionTokenFromCookies();
  if (!token) return null;

  const prisma = getPrismaClient();
  if (!prisma) return null;

  return prisma.user.findFirst({ where: { sessionToken: token } });
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
  };
}
