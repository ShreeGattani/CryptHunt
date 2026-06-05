import { NextResponse } from "next/server";
import { getAuthenticatedUser, toPublicUser, checkIsLocked } from "@/lib/server/auth";
import { getPublicQuestion, MAX_LEVEL } from "@/lib/server/game-data";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/server/rate-limit";

/**
 * Deliver the authenticated user's current question — text and hint only.
 * The answer never leaves the server.
 */
export async function GET(request: Request) {
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
  const rate = checkRateLimit(`question:${user.id}:${ip}`, 30, 60_000);
  if (!rate.allowed) return rateLimitResponse(rate.retryAfterSec);

  const { searchParams } = new URL(request.url);
  const levelId = parseInt(searchParams.get("levelId") || "", 10);

  if (Number.isNaN(levelId) || levelId < 1 || levelId > MAX_LEVEL) {
    return NextResponse.json({ success: false, message: "Invalid level." }, { status: 400 });
  }

  if (user.currentLevel > MAX_LEVEL) {
    return NextResponse.json({ success: false, message: "Game already completed." }, { status: 403 });
  }

  if (levelId !== user.currentLevel) {
    return NextResponse.json({ success: false, message: "Level locked or not active." }, { status: 403 });
  }

  if (user.levelCompletePending) {
    return NextResponse.json({ success: true, levelCompletePending: true, user: toPublicUser(user) });
  }

  const question = getPublicQuestion(user.currentLevel, user.currentQuestion);
  if (!question) {
    return NextResponse.json({ success: false, message: "No active question." }, { status: 404 });
  }

  return NextResponse.json({ success: true, question, user: toPublicUser(user) });
}
