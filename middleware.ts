import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "crypthunt_session";
const PROTECTED_PREFIXES = ["/dashboard", "/level", "/leaderboard"];

/** A valid session cookie is 64 lowercase hex chars (crypto.randomBytes(32).toString('hex')). */
function isValidTokenFormat(value: string): boolean {
  return value.length === 64 && /^[0-9a-f]+$/.test(value);
}

export function middleware(request: NextRequest) {
  const sessionValue = request.cookies.get(SESSION_COOKIE)?.value ?? "";
  const hasValidCookie = sessionValue !== "" && isValidTokenFormat(sessionValue);
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (isProtected && !hasValidCookie) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (pathname === "/" && hasValidCookie) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/dashboard/:path*", "/level/:path*", "/leaderboard/:path*"],
};
