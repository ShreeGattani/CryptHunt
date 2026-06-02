import crypto from "crypto";
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import bcrypt from "bcryptjs";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/server/rate-limit";
import { requirePrismaClient } from "@/lib/server/prisma";

// Constant response shape — every OTP send returns the same JSON structure
// regardless of whether the email is registered, already maxed, or new.
// Varying sentCount or message wording would let an attacker enumerate accounts.
const OTP_SENT_RESPONSE = {
  success: true,
  message: "Verification key dispatched to your email node.",
  sentCount: 1,
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!email || !email.includes("@") || email.length > 254) {
      return NextResponse.json(
        { success: false, message: "Core email node is invalid or empty." },
        { status: 400 }
      );
    }

    const ip = getClientIp(request);
    const rate = checkRateLimit(`otp:${ip}:${email}`, 3, 60 * 60_000);
    if (!rate.allowed) return rateLimitResponse(rate.retryAfterSec);

    const prisma = requirePrismaClient();

    const alreadyRegistered = !!(await prisma.user.findUnique({ where: { email } }));
    const existingOtp = await prisma.otpRecord.findUnique({ where: { email } });
    const currentCount = existingOtp ? existingOtp.sentCount : 0;

    // Silently no-op for registered emails and maxed OTPs.
    // Response is identical to a real dispatch — caller cannot distinguish.
    if (alreadyRegistered || currentCount >= 2) {
      return NextResponse.json(OTP_SENT_RESPONSE);
    }

    const rawOtp = crypto.randomInt(100000, 999999).toString();
    const hashedOtp = await bcrypt.hash(rawOtp, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const nextCount = currentCount + 1;

    await prisma.otpRecord.upsert({
      where: { email },
      update: { otp: hashedOtp, sentCount: nextCount, expiresAt },
      create: { email, otp: hashedOtp, sentCount: nextCount, expiresAt },
    });

    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_PASS;

    if (gmailUser && gmailPass) {
      try {
        const transporter = nodemailer.createTransport({ service: "gmail", auth: { user: gmailUser, pass: gmailPass } });
        await transporter.sendMail({
          from: `"CRYPTHUNT Portal" <${gmailUser}>`,
          to: email,
          subject: "[CRYPTHUNT] Identity verification key inside...",
          html: `<div style="background-color:#09090b;border:2px solid #7f1d1d;color:#f4f4f5;font-family:monospace;padding:24px;"><h2 style="color:#ef4444;text-align:center;">CRYPTHUNT // IDENTITY HANDSHAKE</h2><p>Inject this decryption key into your registration form:</p><div style="font-size:32px;font-weight:bold;text-align:center;color:#ef4444;letter-spacing:8px;padding:16px;">${rawOtp}</div><p style="text-align:center;font-size:11px;color:#71717a;">Expires in 10 minutes.</p></div>`,
        });
      } catch (e) {
        console.error("Nodemailer failed:", e);
      }
    } else if (process.env.NODE_ENV === "development") {
      console.log(`[DEV ONLY] OTP for ${email}: ${rawOtp}`);
    }

    return NextResponse.json(OTP_SENT_RESPONSE);
  } catch {
    return NextResponse.json(
      { success: false, message: "Internal server registry error." },
      { status: 500 }
    );
  }
}
