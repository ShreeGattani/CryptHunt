import { NextResponse } from "next/server";
import { attachSessionCookie, createSessionToken, toPublicUser } from "@/lib/server/auth";
import { hashPassword, isLegacyPlaintext, verifyPassword } from "@/lib/server/password";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/server/rate-limit";
import { requirePrismaClient } from "@/lib/server/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email and decryption key must be supplied." },
        { status: 400 }
      );
    }

    const ip = getClientIp(request);
    const rate = checkRateLimit(`login:${ip}:${email}`, 5, 10 * 60_000);
    if (!rate.allowed) return rateLimitResponse(rate.retryAfterSec);

    const prisma = requirePrismaClient();
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !(await verifyPassword(password, user.password))) {
      return NextResponse.json(
        { success: false, message: "DECRYPTION DENIED. INVALID EMAIL OR PASSWORD KEY." },
        { status: 401 }
      );
    }

    // Transparent bcrypt migration for legacy plaintext accounts
    if (isLegacyPlaintext(user.password)) {
      await prisma.user.update({
        where: { id: user.id },
        data: { password: await hashPassword(password) },
      });
    }

    const sessionToken = createSessionToken();
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { sessionToken },
    });

    const response = NextResponse.json({
      success: true,
      message: "Authentication handshake successful.",
      user: toPublicUser(updated),
    });

    return attachSessionCookie(response, sessionToken);
  } catch {
    return NextResponse.json(
      { success: false, message: "Internal server authentication error." },
      { status: 500 }
    );
  }
}
