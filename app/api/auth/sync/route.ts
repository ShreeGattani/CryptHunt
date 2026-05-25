import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

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
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Agent profile not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      databaseStatus: "CONNECTED",
      data: user,
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
    const { email, elapsedTime } = body;

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

    await prisma.user.update({
      where: { email: email.toLowerCase() },
      data: { elapsedTime: parseInt(elapsedTime, 10) },
    });

    return NextResponse.json({
      success: true,
      databaseStatus: "CONNECTED",
      message: "Elapsed time synchronized successfully."
    });
  } catch (error: any) {
    console.error("Database sync post error:", error);
    return NextResponse.json({
      success: true,
      databaseStatus: "OFFLINE_FALLBACK",
    });
  }
}
