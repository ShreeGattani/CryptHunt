import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import nodemailer from "nodemailer";

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
    const { email } = body;

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { success: false, message: "Core email node is invalid or empty." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const prisma = getPrismaClient();

    if (!prisma) {
      // Offline fallback simulation
      const mockOtp = "1337";
      console.log(`[OFFLINE FALLBACK] Generated Mock OTP for ${normalizedEmail}: ${mockOtp}`);
      return NextResponse.json({
        success: true,
        message: "Database offline. Offline fallback enabled. Local code simulated.",
        databaseStatus: "OFFLINE_FALLBACK",
        devOtp: mockOtp,
        sentCount: 1,
      });
    }

    try {
      // 1. Check if email is already registered
      const existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (existingUser) {
        return NextResponse.json(
          { success: false, message: "EMAIL ALREADY REGISTERED MATRIX INDUCTION." },
          { status: 400 }
        );
      }

      // 2. Check current OTP status
      const existingOtpRecord = await prisma.otpRecord.findUnique({
        where: { email: normalizedEmail },
      });

      const currentCount = existingOtpRecord ? existingOtpRecord.sentCount : 0;

      if (currentCount >= 2) {
        return NextResponse.json(
          {
            success: false,
            message: `TRANSMISSION DENIED: MAXIMUM OTP LIMIT (2/2) EXCEEDED FOR ${normalizedEmail.toUpperCase()}.`,
          },
          { status: 400 }
        );
      }

      // 3. Generate secure 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiration
      const nextCount = currentCount + 1;

      // 4. Save to Database
      await prisma.otpRecord.upsert({
        where: { email: normalizedEmail },
        update: {
          otp,
          sentCount: nextCount,
          expiresAt,
        },
        create: {
          email: normalizedEmail,
          otp,
          sentCount: nextCount,
          expiresAt,
        },
      });

      // 5. Send Email
      const gmailUser = process.env.GMAIL_USER;
      const gmailPass = process.env.GMAIL_PASS;

      let emailSent = false;
      let emailError = "";

      if (gmailUser && gmailPass) {
        try {
          const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
              user: gmailUser,
              pass: gmailPass,
            },
          });

          const htmlContent = `
            <div style="background-color: #09090b; border: 2px solid #7f1d1d; color: #f4f4f5; font-family: Courier New, Courier, monospace; padding: 24px; border-radius: 4px; max-width: 600px; margin: 0 auto; box-shadow: 0 0 15px rgba(239, 68, 68, 0.2);">
              <h2 style="color: #ef4444; border-bottom: 1px dashed #7f1d1d; padding-bottom: 12px; margin-top: 0; letter-spacing: 2px; text-transform: uppercase; font-weight: bold; text-align: center;">CRYPTHUNT // IDENTITY HANDSHAKE</h2>
              <p style="color: #a1a1aa; font-size: 14px; line-height: 1.5;">An agent registration attempt has been initiated on our decryption portal for this address.</p>
              <p style="color: #a1a1aa; font-size: 14px; line-height: 1.5;">Inject the following decryption key into your registration form to verify your consciousness:</p>
              <div style="background-color: #020617; border: 1px solid #7f1d1d; color: #ef4444; font-size: 32px; font-weight: bold; text-align: center; padding: 16px; margin: 24px 0; border-radius: 4px; letter-spacing: 8px; text-shadow: 0 0 8px rgba(239, 68, 68, 0.4);">
                ${otp}
              </div>
              <p style="color: #dc2626; font-size: 12px; font-weight: bold; margin-bottom: 8px; text-align: center; text-transform: uppercase;">
                DISPATCH ATTEMPT ${nextCount} OF 2
              </p>
              <p style="color: #71717a; font-size: 11px; margin-bottom: 0; text-align: center;">This transmission key will disintegrate in 10 minutes.</p>
              <p style="color: #ef4444; font-size: 10px; margin-top: 8px; text-align: center; opacity: 0.6; text-transform: uppercase;">
                WARNING: WE WILL WATCH YOU FALL IN LOVE WITH THE VOID.
              </p>
            </div>
          `;

          await transporter.sendMail({
            from: `"CRYPTHUNT Portal" <${gmailUser}>`,
            to: normalizedEmail,
            subject: `[CRYPTHUNT] Identity verification key inside...`,
            html: htmlContent,
          });

          emailSent = true;
        } catch (e: unknown) {
          console.error("Nodemailer failed to dispatch OTP email:", e);
          emailError = getErrorMessage(e);
        }
      } else {
        console.log(`[GMAIL SMTP NOT CONFIGURED] Generated OTP for ${normalizedEmail}: ${otp}`);
      }

      // 6. Return response
      const isDev = process.env.NODE_ENV === "development" || !process.env.GMAIL_USER;
      return NextResponse.json({
        success: true,
        message: emailSent
          ? `Verification key dispatched to your email node. (${nextCount}/2)`
          : `Handshake initiated. (Attempts: ${nextCount}/2). Check server terminal for keys.`,
        databaseStatus: "CONNECTED",
        sentCount: nextCount,
        // Premium feature: Expose OTP in response for developers if SMTP is offline/dev
        devOtp: isDev ? otp : undefined,
        debugError: emailError ? emailError : undefined,
      });

    } catch (dbError: unknown) {
      console.error("Database OTP operation failed:", dbError);
      return NextResponse.json(
        { success: false, message: "Registry error: Failed to record verification sequence." },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, message: "Internal server registry error.", error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
