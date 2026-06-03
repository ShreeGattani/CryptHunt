import { NextResponse } from "next/server";
import { clearSessionCookieOnResponse, getAuthenticatedUser, getSessionTokenFromCookies } from "@/lib/server/auth";
import { requirePrismaClient } from "@/lib/server/prisma";

/** Invalidate the session token in the database and clear the cookie. */
export async function POST() {
  const user = await getAuthenticatedUser();
  if (!user) {
    // No valid session — still clear any stale cookie, but signal unauthenticated
    const response = NextResponse.json({ success: false, message: "Not authenticated." }, { status: 401 });
    return clearSessionCookieOnResponse(response);
  }
  try {
    const prisma = requirePrismaClient();
    await prisma.user.update({ where: { id: user.id }, data: { sessionToken: null } });
  } catch {
    // Always clear the cookie even if the DB write fails
  }
  const response = NextResponse.json({ success: true, message: "Logged out." });
  return clearSessionCookieOnResponse(response);
}
