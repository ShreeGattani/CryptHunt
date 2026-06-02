import { NextResponse } from "next/server";
import { getAuthenticatedUser, toPublicUser } from "@/lib/server/auth";
import { requirePrismaClient } from "@/lib/server/prisma";

/** Pull the authenticated user's current state from the database. */
export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ success: false, message: "Authentication required." }, { status: 401 });
  }
  return NextResponse.json({ success: true, user: toPublicUser(user) });
}

/**
 * Sync elapsed time only. Score, level, and question are managed exclusively
 * by /api/game/submit and /api/game/complete-level — never by this route.
 * elapsedTime is monotonic: it can only increase.
 */
export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ success: false, message: "Authentication required." }, { status: 401 });
  }

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
