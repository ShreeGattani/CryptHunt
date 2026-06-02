import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "crypthunt_session";
const PROTECTED_PREFIXES = ["/dashboard", "/level", "/leaderboard"];

export function middleware(request: NextRequest) {
  const session = request.cookies.get(SESSION_COOKIE);
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (isProtected && !session?.value) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (pathname === "/" && session?.value) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/dashboard/:path*", "/level/:path*", "/leaderboard/:path*"],
};
