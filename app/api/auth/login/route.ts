import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Unknown error";

// Lazy Graceful Prisma Client instantiation
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email and decryption key must be supplied." },
        { status: 400 }
      );
    }

    const prisma = getPrismaClient();

    if (prisma) {
      try {
        const user = await prisma.user.findUnique({
          where: { email }
        });

        if (!user || user.password !== password) {
          return NextResponse.json(
            { success: false, message: "DECRYPTION DENIED. INVALID EMAIL OR PASSWORD KEY." },
            { status: 401 }
          );
        }

        const sessionToken = Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
        await prisma.user.update({
          where: { id: user.id },
          data: { sessionToken }
        });

        return NextResponse.json({
          success: true,
          message: "Authentication handshake successful.",
          databaseStatus: "CONNECTED",
          user: {
            username: user.username,
            email: user.email,
            score: user.score,
            currentLevel: user.currentLevel,
            currentQuestion: user.currentQuestion,
            elapsedTime: user.elapsedTime,
            sessionToken
          }
        });
      } catch (dbError: unknown) {
        console.warn("MySQL Offline: Falling back to local verification system.", getErrorMessage(dbError));
        return NextResponse.json({
          success: true,
          message: "Database connection offline. Enabling Local Storage fallback validation.",
          databaseStatus: "OFFLINE_FALLBACK",
          credentialsCheck: { email, password }
        });
      }
    } else {
      return NextResponse.json({
        success: true,
        message: "Database client offline. Enabling Local Storage fallback validation.",
        databaseStatus: "OFFLINE_FALLBACK",
        credentialsCheck: { email, password }
      });
    }
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, message: "Internal server authentication error.", error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
