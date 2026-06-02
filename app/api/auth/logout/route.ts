import { NextResponse } from "next/server";
import { clearSessionCookieOnResponse, getAuthenticatedUser, getSessionTokenFromCookies } from "@/lib/server/auth";
import { requirePrismaClient } from "@/lib/server/prisma";

/** Invalidate the session token in the database and clear the cookie. */
export async function POST() {
  try {
    const token = await getSessionTokenFromCookies();
    const user = await getAuthenticatedUser();
    if (user && token) {
      const prisma = requirePrismaClient();
      await prisma.user.update({ where: { id: user.id }, data: { sessionToken: null } });
    }
  } catch {
    // Always clear the cookie even if DB is unreachable
  }
  const response = NextResponse.json({ success: true, message: "Logged out." });
  return clearSessionCookieOnResponse(response);
}
