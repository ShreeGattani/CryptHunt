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
    const { username, email, password, otp } = body;

    if (!username || !email || !password || !otp) {
      return NextResponse.json(
        { success: false, message: "Alias, email, password, and decryption OTP must be supplied." },
        { status: 400 }
      );
    }

    const prisma = getPrismaClient();

    if (prisma) {
      try {
        const normalizedEmail = email.trim().toLowerCase();

        // 1. Verify OTP record
        const otpRecord = await prisma.otpRecord.findUnique({
          where: { email: normalizedEmail }
        });

        if (!otpRecord) {
          return NextResponse.json(
            { success: false, message: "NO OTP HANDSHAKE INITIATED FOR THIS EMAIL ADDRESS." },
            { status: 400 }
          );
        }

        // 2. Check expiration
        if (new Date() > otpRecord.expiresAt) {
          return NextResponse.json(
            { success: false, message: "DECRYPTION KEY HAS EXPIRED. PLEASE RE-SEND OTP." },
            { status: 400 }
          );
        }

        // 3. Verify value match
        if (otpRecord.otp !== otp.trim()) {
          return NextResponse.json(
            { success: false, message: "INVALID DECRYPTION KEY. COGNITIVE HANDSHAKE ABORTED." },
            { status: 400 }
          );
        }

        // 4. Check if email already registered
        const existingEmail = await prisma.user.findUnique({
          where: { email: normalizedEmail }
        });
        if (existingEmail) {
          return NextResponse.json(
            { success: false, message: "EMAIL ALREADY REGISTERED MATRIX INDUCTION." },
            { status: 400 }
          );
        }

        // 5. Check if username already registered
        const existingUsername = await prisma.user.findUnique({
          where: { username }
        });
        if (existingUsername) {
          return NextResponse.json(
            { success: false, message: "HACKER ALIAS IN USE BY ANOTHER AGENT." },
            { status: 400 }
          );
        }

        // Delete the verified OTP record so it can't be re-used
        await prisma.otpRecord.delete({
          where: { email: normalizedEmail }
        });

        const sessionToken = Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
        
        // Register user
        const user = await prisma.user.create({
          data: {
            username,
            email: normalizedEmail,
            password, // Storing simple string for started project
            sessionToken
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
            currentLevel: user.currentLevel,
            sessionToken
          }
        });
      } catch (dbError: unknown) {
        console.warn("Database Offline: Falling back to local verification system.", getErrorMessage(dbError));

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
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, message: "Internal server registry error.", error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
