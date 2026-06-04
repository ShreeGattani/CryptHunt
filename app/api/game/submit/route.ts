import { NextResponse } from "next/server";
import { getAuthenticatedUser, toPublicUser, checkIsLocked } from "@/lib/server/auth";
import { getQuestionPoints, isAnswerCorrect, MAX_LEVEL, QUESTIONS_PER_LEVEL } from "@/lib/server/game-data";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/server/rate-limit";
import { requirePrismaClient } from "@/lib/server/prisma";
import { logAttempt } from "@/lib/server/sheets-logger";

/**
 * Validate an answer server-side. The answer is never sent to the client.
 * Questions 1–5 advance currentQuestion immediately.
 * Question 6 sets levelCompletePending=true; level advances via /api/game/complete-level.
 *
 * Concurrency: conditional updateMany ensures idempotency. If two simultaneous
 * correct submits race, only the first will match the expected state (currentQuestion
 * and levelCompletePending=false); the second finds count=0 and returns the fresh state.
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

  // Already at level-complete gate — idempotent acknowledge
  if (user.levelCompletePending && questionNumber === QUESTIONS_PER_LEVEL) {
    return NextResponse.json({
      success: true,
      message: "Level fully decrypted. Exit to secure logs.",
      isLevelComplete: true,
      user: toPublicUser(user),
    });
  }

  const isCorrect = isAnswerCorrect(levelId, questionNumber, answer);

  logAttempt({
    userId: user.id,
    username: user.username,
    levelId,
    questionNumber,
    submittedAnswer: answer,
    isCorrect,
  });

  if (!isCorrect) {
    return NextResponse.json({ success: false, message: "ACCESS DENIED. Decryption key incorrect.", isLevelComplete: false });
  }

  const points = getQuestionPoints(levelId, questionNumber);
  const isLastQuestion = questionNumber === QUESTIONS_PER_LEVEL;
  const prisma = requirePrismaClient();

  if (isLastQuestion) {
    // Conditional update: only applies if the state hasn't already changed (race guard)
    const result = await prisma.user.updateMany({
      where: { id: user.id, currentQuestion: questionNumber, levelCompletePending: false },
      data: { levelCompletePending: true },
    });

    // If count=0, a parallel request already set the flag; fetch fresh state
    const fresh = result.count === 0
      ? await prisma.user.findUnique({ where: { id: user.id } })
      : null;
    const finalUser = fresh ?? await prisma.user.findUnique({ where: { id: user.id } });

    return NextResponse.json({
      success: true,
      message: `ACCESS GRANTED! +${points} pts. Level fully decrypted!`,
      isLevelComplete: true,
      points,
      user: finalUser ? toPublicUser(finalUser) : toPublicUser(user),
    });
  }

  // Conditional update: only applies if currentQuestion still matches what we read
  const result = await prisma.user.updateMany({
    where: { id: user.id, currentQuestion: questionNumber, levelCompletePending: false },
    data: { score: user.score + points, currentQuestion: questionNumber + 1 },
  });

  // If count=0, state already advanced (duplicate submit race); return fresh state
  const finalUser = await prisma.user.findUnique({ where: { id: user.id } });

  if (result.count === 0) {
    return NextResponse.json({
      success: true,
      message: "Already processed.",
      isLevelComplete: false,
      user: finalUser ? toPublicUser(finalUser) : toPublicUser(user),
    });
  }

  return NextResponse.json({
    success: true,
    message: `ACCESS GRANTED! +${points} pts. Moving to next lock...`,
    isLevelComplete: false,
    points,
    user: finalUser ? toPublicUser(finalUser) : toPublicUser(user),
  });
}
