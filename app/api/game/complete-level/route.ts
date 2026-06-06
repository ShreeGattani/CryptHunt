import { NextResponse } from "next/server";
import { getAuthenticatedUser, toPublicUser, checkIsLocked, getLockErrorMessage } from "@/lib/server/auth";
import { getQuestionPoints, MAX_LEVEL, QUESTIONS_PER_LEVEL } from "@/lib/server/game-data";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/server/rate-limit";
import { requirePrismaClient } from "@/lib/server/prisma";

/**
 * Finalize a completed level. Awards Q6 points and advances currentLevel.
 * Only callable when levelCompletePending=true — enforced server-side.
 *
 * Concurrency: conditional updateMany on (levelCompletePending=true, currentLevel)
 * ensures this is idempotent — double-tapping the button cannot double-award points.
 */
export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ success: false, message: "Authentication required." }, { status: 401 });
  }

  if (checkIsLocked(user.createdAt)) {
    return NextResponse.json(
      { success: false, message: getLockErrorMessage(user.createdAt) },
      { status: 403 }
    );
  }

  const ip = getClientIp(request);
  const rate = checkRateLimit(`complete:${user.id}:${ip}`, 5, 60_000);
  if (!rate.allowed) return rateLimitResponse(rate.retryAfterSec);

  if (!user.levelCompletePending || user.currentQuestion !== QUESTIONS_PER_LEVEL) {
    return NextResponse.json({ success: false, message: "Level not ready to complete." }, { status: 403 });
  }

  if (user.currentLevel > MAX_LEVEL) {
    return NextResponse.json({ success: false, message: "Game already completed." }, { status: 403 });
  }

  const prisma = requirePrismaClient();
  const completedLevel = user.currentLevel;
  const finalPoints = getQuestionPoints(completedLevel, QUESTIONS_PER_LEVEL);
  const nextLevel = completedLevel + 1;
  const allDone = nextLevel > MAX_LEVEL;

  // Conditional update: only applies if the user is still in the pending state we read.
  // A second simultaneous call finds count=0 and returns the already-advanced state.
  const result = await prisma.user.updateMany({
    where: {
      id: user.id,
      levelCompletePending: true,
      currentLevel: completedLevel,
    },
    data: {
      score: user.score + finalPoints,
      currentLevel: nextLevel,
      currentQuestion: 1,
      levelCompletePending: false,
      completedAt: allDone ? new Date() : null,
    },
  });

  if (result.count > 0) {
    // This request won the race — record level progress
    await prisma.levelProgress.upsert({
      where: { userId_level: { userId: user.id, level: completedLevel } },
      update: { completed: true, completedAt: new Date() },
      create: { userId: user.id, level: completedLevel, completed: true, completedAt: new Date() },
    });
  }

  // Return fresh state regardless of which request "won"
  const fresh = await prisma.user.findUnique({ where: { id: user.id } });

  return NextResponse.json({
    success: true,
    message: allDone ? "All levels decrypted. Hunt complete." : "Level secured.",
    user: fresh ? toPublicUser(fresh) : toPublicUser(user),
  });
}
