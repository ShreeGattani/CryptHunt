import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

// Lazy Graceful Prisma Client instantiation
function getPrismaClient() {
  try {
    return new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL || "mysql://root:password@localhost:3306/crypthunt"
        }
      }
    } as any);
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
            elapsedTime: user.elapsedTime
          }
        });
      } catch (dbError: any) {
        console.warn("MySQL Offline: Falling back to local verification system.", dbError.message);
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
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Internal server authentication error.", error: error.message },
      { status: 500 }
    );
  }
}
