import { NextResponse } from "next/server";
import { attachSessionCookie, createSessionToken, toPublicUser } from "@/lib/server/auth";
import { hashPassword } from "@/lib/server/password";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/server/rate-limit";
import { requirePrismaClient } from "@/lib/server/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const username = typeof body.username === "string" ? body.username.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const otp = typeof body.otp === "string" ? body.otp.trim() : "";

    if (!username || !email || !password || !otp) {
      return NextResponse.json(
        { success: false, message: "Alias, email, password, and OTP must be supplied." },
        { status: 400 }
      );
    }

    if (username.length > 32 || !/^[a-zA-Z0-9_\- ]+$/.test(username)) {
      return NextResponse.json(
        { success: false, message: "Alias must be 1-32 chars: letters, numbers, spaces, _ or -." },
        { status: 400 }
      );
    }

    if (password.length < 4 || password.length > 128) {
      return NextResponse.json(
        { success: false, message: "Password must be between 4 and 128 characters." },
        { status: 400 }
      );
    }

    const ip = getClientIp(request);
    const rate = checkRateLimit(`register:${ip}`, 5, 60 * 60_000);
    if (!rate.allowed) return rateLimitResponse(rate.retryAfterSec);

    const prisma = requirePrismaClient();

    const otpRecord = await prisma.otpRecord.findUnique({ where: { email } });
    if (!otpRecord) {
      return NextResponse.json(
        { success: false, message: "NO OTP HANDSHAKE INITIATED FOR THIS EMAIL ADDRESS." },
        { status: 400 }
      );
    }
    if (new Date() > otpRecord.expiresAt) {
      return NextResponse.json(
        { success: false, message: "DECRYPTION KEY HAS EXPIRED. PLEASE RE-SEND OTP." },
        { status: 400 }
      );
    }
    if (otpRecord.otp !== otp) {
      return NextResponse.json(
        { success: false, message: "INVALID DECRYPTION KEY. COGNITIVE HANDSHAKE ABORTED." },
        { status: 400 }
      );
    }

    if (await prisma.user.findUnique({ where: { email } })) {
      return NextResponse.json(
        { success: false, message: "EMAIL ALREADY REGISTERED MATRIX INDUCTION." },
        { status: 400 }
      );
    }
    if (await prisma.user.findUnique({ where: { username } })) {
      return NextResponse.json(
        { success: false, message: "HACKER ALIAS IN USE BY ANOTHER AGENT." },
        { status: 400 }
      );
    }

    await prisma.otpRecord.delete({ where: { email } });

    const sessionToken = createSessionToken();
    const user = await prisma.user.create({
      data: { username, email, password: await hashPassword(password), sessionToken },
    });

    const response = NextResponse.json({
      success: true,
      message: "Agent consciousness successfully registered.",
      user: toPublicUser(user),
    });

    return attachSessionCookie(response, sessionToken);
  } catch {
    return NextResponse.json(
      { success: false, message: "Internal server registry error." },
      { status: 500 }
    );
  }
}
