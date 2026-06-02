import { NextResponse } from "next/server";
import { getAuthenticatedUser, toPublicUser } from "@/lib/server/auth";
import { getQuestionPoints, MAX_LEVEL, QUESTIONS_PER_LEVEL } from "@/lib/server/game-data";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/server/rate-limit";
import { requirePrismaClient } from "@/lib/server/prisma";

/**
 * Finalize a completed level. Awards Q6 points and advances currentLevel.
 * Only callable when levelCompletePending=true — enforced server-side.
 */
export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ success: false, message: "Authentication required." }, { status: 401 });
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
  const finalPoints = getQuestionPoints(user.currentLevel, QUESTIONS_PER_LEVEL);
  const nextLevel = user.currentLevel + 1;
  const allDone = nextLevel > MAX_LEVEL;

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      score: user.score + finalPoints,
      currentLevel: nextLevel,
      currentQuestion: 1,
      levelCompletePending: false,
      completedAt: allDone ? new Date() : null,
    },
  });

  await prisma.levelProgress.upsert({
    where: { userId_level: { userId: user.id, level: user.currentLevel } },
    update: { completed: true, completedAt: new Date() },
    create: { userId: user.id, level: user.currentLevel, completed: true, completedAt: new Date() },
  });

  return NextResponse.json({
    success: true,
    message: allDone ? "All levels decrypted. Hunt complete." : "Level secured.",
    user: toPublicUser(updated),
  });
}
