import { NextResponse } from "next/server";
import { getAuthenticatedUser, toPublicUser, checkIsLocked } from "@/lib/server/auth";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/server/rate-limit";
import { requirePrismaClient } from "@/lib/server/prisma";

/**
 * Pull the authenticated user's current state from the database.
 * Rate limited to 6 calls per minute per user — the client syncs every 30s,
 * so 6/min gives a 3x buffer for reconnects and page refreshes.
 * Locked users receive their state (so the UI can read isLocked) but cannot
 * write elapsed time until the hunt starts.
 */
export async function GET(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ success: false, message: "Authentication required." }, { status: 401 });
  }

  const ip = getClientIp(request);
  const rate = checkRateLimit(`sync-get:${user.id}:${ip}`, 6, 60_000);
  if (!rate.allowed) return rateLimitResponse(rate.retryAfterSec);

  return NextResponse.json({ success: true, user: toPublicUser(user) });
}

/**
 * Sync elapsed time only. Score, level, and question are managed exclusively
 * by /api/game/submit and /api/game/complete-level — never by this route.
 * elapsedTime is monotonic: it can only increase (Math.max enforced server-side).
 * Rate limited to 6 calls per minute per user.
 * Locked users are rejected — their timer cannot start before the hunt does.
 */
export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ success: false, message: "Authentication required." }, { status: 401 });
  }

  if (checkIsLocked(user.createdAt)) {
    return NextResponse.json(
      { success: false, message: "HUNT HAS NOT STARTED. ACCESS DENIED UNTIL JUNE 6, 12:00 PM IST." },
      { status: 403 }
    );
  }

  const ip = getClientIp(request);
  const rate = checkRateLimit(`sync-post:${user.id}:${ip}`, 6, 60_000);
  if (!rate.allowed) return rateLimitResponse(rate.retryAfterSec);

  let body: { elapsedTime?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: "Invalid request body." }, { status: 400 });
  }

  if (body.elapsedTime === undefined) {
    return NextResponse.json({ success: false, message: "Missing elapsedTime." }, { status: 400 });
  }

  const elapsedTime = parseInt(String(body.elapsedTime), 10);
  if (Number.isNaN(elapsedTime) || elapsedTime < 0 || elapsedTime > 86400 * 365) {
    return NextResponse.json({ success: false, message: "Invalid elapsedTime." }, { status: 400 });
  }

  const prisma = requirePrismaClient();
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { elapsedTime: Math.max(user.elapsedTime, elapsedTime) },
  });

  return NextResponse.json({ success: true, user: toPublicUser(updated) });
}
