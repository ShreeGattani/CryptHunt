import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/server/rate-limit";
import { requirePrismaClient } from "@/lib/server/prisma";

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

    if (await prisma.user.findUnique({ where: { email } })) {
      return NextResponse.json(
        { success: false, message: "EMAIL ALREADY REGISTERED MATRIX INDUCTION." },
        { status: 400 }
      );
    }

    const existingOtp = await prisma.otpRecord.findUnique({ where: { email } });
    const currentCount = existingOtp ? existingOtp.sentCount : 0;

    if (currentCount >= 2) {
      return NextResponse.json(
        { success: false, message: `TRANSMISSION DENIED: MAXIMUM OTP LIMIT (2/2) EXCEEDED FOR ${email.toUpperCase()}.` },
        { status: 400 }
      );
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const nextCount = currentCount + 1;

    await prisma.otpRecord.upsert({
      where: { email },
      update: { otp, sentCount: nextCount, expiresAt },
      create: { email, otp, sentCount: nextCount, expiresAt },
    });

    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_PASS;
    let emailSent = false;

    if (gmailUser && gmailPass) {
      try {
        const transporter = nodemailer.createTransport({ service: "gmail", auth: { user: gmailUser, pass: gmailPass } });
        await transporter.sendMail({
          from: `"CRYPTHUNT Portal" <${gmailUser}>`,
          to: email,
          subject: "[CRYPTHUNT] Identity verification key inside...",
          html: `<div style="background-color:#09090b;border:2px solid #7f1d1d;color:#f4f4f5;font-family:monospace;padding:24px;"><h2 style="color:#ef4444;text-align:center;">CRYPTHUNT // IDENTITY HANDSHAKE</h2><p>Inject this decryption key into your registration form:</p><div style="font-size:32px;font-weight:bold;text-align:center;color:#ef4444;letter-spacing:8px;padding:16px;">${otp}</div><p style="text-align:center;font-size:12px;">DISPATCH ATTEMPT ${nextCount} OF 2</p><p style="text-align:center;font-size:11px;color:#71717a;">Expires in 10 minutes.</p></div>`,
        });
        emailSent = true;
      } catch (e) {
        console.error("Nodemailer failed:", e);
      }
    } else if (process.env.NODE_ENV === "development") {
      // In local dev only — OTP is printed to server console, never to the API response
      console.log(`[DEV ONLY] OTP for ${email}: ${otp}`);
    }

    return NextResponse.json({
      success: true,
      message: emailSent
        ? `Verification key dispatched to your email node. (${nextCount}/2)`
        : `Handshake initiated. (Attempts: ${nextCount}/2). Check your email.`,
      sentCount: nextCount,
      // devOtp is intentionally omitted — it is shown only in the server terminal
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Internal server registry error." },
      { status: 500 }
    );
  }
}
