import { NextResponse } from "next/server";
import { getAuthenticatedUser, toPublicUser } from "@/lib/server/auth";
import { getQuestionPoints, isAnswerCorrect, MAX_LEVEL, QUESTIONS_PER_LEVEL } from "@/lib/server/game-data";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/server/rate-limit";
import { requirePrismaClient } from "@/lib/server/prisma";

/**
 * Validate an answer server-side. The answer is never sent to the client.
 * Questions 1–5 advance currentQuestion immediately.
 * Question 6 sets levelCompletePending=true; level advances via /api/game/complete-level.
 */
export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ success: false, message: "Authentication required." }, { status: 401 });
  }

  const ip = getClientIp(request);
  const rate = checkRateLimit(`submit:${user.id}:${ip}`, 10, 60_000);
  if (!rate.allowed) return rateLimitResponse(rate.retryAfterSec);

  if (user.currentLevel > MAX_LEVEL) {
    return NextResponse.json({ success: false, message: "Game already completed." }, { status: 403 });
  }

  let body: { answer?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: "Invalid request body." }, { status: 400 });
  }

  const answer = typeof body.answer === "string" ? body.answer.trim() : "";
  if (!answer || answer.length > 500) {
    return NextResponse.json({ success: false, message: "Decryption input cannot be empty." }, { status: 400 });
  }

  const levelId = user.currentLevel;
  const questionNumber = user.currentQuestion;

  if (questionNumber < 1 || questionNumber > QUESTIONS_PER_LEVEL) {
    return NextResponse.json({ success: false, message: "No active question." }, { status: 400 });
  }

  // If user is already at the level-complete gate, acknowledge without re-validating
  if (user.levelCompletePending && questionNumber === QUESTIONS_PER_LEVEL) {
    return NextResponse.json({
      success: true,
      message: "Level fully decrypted. Exit to secure logs.",
      isLevelComplete: true,
      user: toPublicUser(user),
    });
  }

  if (!isAnswerCorrect(levelId, questionNumber, answer)) {
    return NextResponse.json({ success: false, message: "ACCESS DENIED. Decryption key incorrect.", isLevelComplete: false });
  }

  const points = getQuestionPoints(levelId, questionNumber);
  const isLastQuestion = questionNumber === QUESTIONS_PER_LEVEL;
  const prisma = requirePrismaClient();

  if (isLastQuestion) {
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { levelCompletePending: true },
    });
    return NextResponse.json({
      success: true,
      message: `ACCESS GRANTED! +${points} pts. Level fully decrypted!`,
      isLevelComplete: true,
      points,
      user: toPublicUser(updated),
    });
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { score: user.score + points, currentQuestion: questionNumber + 1 },
  });

  return NextResponse.json({
    success: true,
    message: `ACCESS GRANTED! +${points} pts. Moving to next lock...`,
    isLevelComplete: false,
    points,
    user: toPublicUser(updated),
  });
}
