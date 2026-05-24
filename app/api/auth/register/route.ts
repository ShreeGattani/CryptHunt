import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

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
    const { username, email, password } = body;

    if (!username || !email || !password) {
      return NextResponse.json(
        { success: false, message: "Username, email, and password must be supplied." },
        { status: 400 }
      );
    }

    const prisma = getPrismaClient();

    if (prisma) {
      try {
        // Check if email already registered
        const existingEmail = await prisma.user.findUnique({
          where: { email }
        });
        if (existingEmail) {
          return NextResponse.json(
            { success: false, message: "EMAIL ALREADY REGISTERED MATRIX INDUCTION." },
            { status: 400 }
          );
        }

        // Check if username already registered
        const existingUsername = await prisma.user.findUnique({
          where: { username }
        });
        if (existingUsername) {
          return NextResponse.json(
            { success: false, message: "HACKER ALIAS IN USE BY ANOTHER AGENT." },
            { status: 400 }
          );
        }

        // Register user
        const user = await prisma.user.create({
          data: {
            username,
            email,
            password // Storing simple string for started project
          }
        });

        return NextResponse.json({
          success: true,
          message: `Agent consciousness successfully registered.`,
          databaseStatus: "CONNECTED",
          user: {
            username: user.username,
            email: user.email,
            score: user.score,
            currentLevel: user.currentLevel
          }
        });
      } catch (dbError: any) {
        console.warn("MySQL Offline: Falling back to local verification system.", dbError.message);
        return NextResponse.json({
          success: true,
          message: "Database connection offline. Enabling Local Storage fallback validation.",
          databaseStatus: "OFFLINE_FALLBACK",
          user: { username, email, score: 0, currentLevel: 1 }
        });
      }
    } else {
      return NextResponse.json({
        success: true,
        message: "Database client offline. Enabling Local Storage fallback validation.",
        databaseStatus: "OFFLINE_FALLBACK",
        user: { username, email, score: 0, currentLevel: 1 }
      });
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Internal server registry error.", error: error.message },
      { status: 500 }
    );
  }
}
