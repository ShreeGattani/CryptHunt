import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { calculateScore } from "../../../utils/score";

// Lazy Graceful Prisma Client instantiation for Prisma 6
function getPrismaClient() {
  try {
    if (!process.env.DATABASE_URL) {
      process.env.DATABASE_URL = "mysql://root:password@localhost:3306/crypthunt";
    }
    return new PrismaClient();
  } catch (e) {
    console.error("Prisma Client initialization failed", e);
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    const sessionToken = searchParams.get("sessionToken");

    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email parameter required." },
        { status: 400 }
      );
    }

    const prisma = getPrismaClient();
    if (!prisma) {
      return NextResponse.json({
        success: true,
        databaseStatus: "OFFLINE_FALLBACK",
        sessionActive: true,
        data: null,
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        score: true,
        currentLevel: true,
        currentQuestion: true,
        elapsedTime: true,
        completedAt: true,
        sessionToken: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Agent profile not found." },
        { status: 404 }
      );
    }

    // Verify session state matches (single login enforcement check)
    const isSessionActive = !sessionToken || !user.sessionToken || user.sessionToken === sessionToken;

    return NextResponse.json({
      success: true,
      databaseStatus: "CONNECTED",
      sessionActive: isSessionActive,
      data: isSessionActive ? {
        score: user.score,
        currentLevel: user.currentLevel,
        currentQuestion: user.currentQuestion,
        elapsedTime: user.elapsedTime,
        completedAt: user.completedAt,
        updatedAt: user.updatedAt.toISOString(),
      } : null,
    });
  } catch (error: any) {
    console.error("Database sync fetch error:", error);
    return NextResponse.json({
      success: true,
      databaseStatus: "OFFLINE_FALLBACK",
      data: null,
    });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, elapsedTime, score, currentLevel, currentQuestion, sessionToken } = body;

    if (!email || elapsedTime === undefined) {
      return NextResponse.json(
        { success: false, message: "Missing required sync parameters: email or elapsedTime." },
        { status: 400 }
      );
    }

    const prisma = getPrismaClient();
    if (!prisma) {
      return NextResponse.json({
        success: true,
        databaseStatus: "OFFLINE_FALLBACK",
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { sessionToken: true, currentLevel: true, currentQuestion: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Agent profile not found." },
        { status: 404 }
      );
    }

    // Verify session state matches before updating ticking time
    if (sessionToken && user.sessionToken && user.sessionToken !== sessionToken) {
      return NextResponse.json({
        success: true,
        databaseStatus: "CONNECTED",
        sessionActive: false,
        message: "Session terminated. Lock overridden."
      });
    }

    // Server-Side Progress Validation (anti-cheat gate)
    let targetLevel = user.currentLevel;
    let targetQuestion = user.currentQuestion;

    const reqLevel = currentLevel !== undefined ? parseInt(currentLevel, 10) : undefined;
    const reqQuestion = currentQuestion !== undefined ? parseInt(currentQuestion, 10) : undefined;

    if (reqLevel !== undefined && reqQuestion !== undefined) {
      const isReset = reqLevel === 1 && reqQuestion === 1;
      const isSame = reqLevel === user.currentLevel && reqQuestion === user.currentQuestion;
      const isNextQuestion = reqLevel === user.currentLevel && reqQuestion === user.currentQuestion + 1;
      const isNextLevel = reqLevel === user.currentLevel + 1 && reqQuestion === 1;

      if (isReset || isSame || isNextQuestion || isNextLevel) {
        targetLevel = reqLevel;
        targetQuestion = reqQuestion;
      } else {
        console.warn(`[ANTI-CHEAT] Out-of-order progress rejected for user ${email}. Requested: Level ${reqLevel} Q${reqQuestion}, Database: Level ${user.currentLevel} Q${user.currentQuestion}`);
      }
    }

    // Deterministically calculate score based on verified progress on the server
    const calculatedScore = calculateScore(targetLevel, targetQuestion);

    await prisma.user.update({
      where: { email: email.toLowerCase() },
      data: { 
        elapsedTime: parseInt(elapsedTime, 10),
        score: calculatedScore,
        currentLevel: targetLevel,
        currentQuestion: targetQuestion,
        completedAt: targetLevel >= 6 ? new Date() : null,
      },
    });

    return NextResponse.json({
      success: true,
      databaseStatus: "CONNECTED",
      sessionActive: true,
      message: "Game state synchronized successfully."
    });
  } catch (error: any) {
    console.error("Database sync post error:", error);
    return NextResponse.json({
      success: true,
      databaseStatus: "OFFLINE_FALLBACK",
    });
  }
}
