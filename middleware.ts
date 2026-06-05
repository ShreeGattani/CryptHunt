import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "crypthunt_session";
const PROTECTED_PREFIXES = ["/dashboard", "/level", "/leaderboard"];

/** A valid session cookie is 64 lowercase hex chars (crypto.randomBytes(32).toString('hex')). */
function isValidTokenFormat(value: string): boolean {
  return value.length === 64 && /^[0-9a-f]+$/.test(value);
}

/**
 * Known bot / scraper / AI-crawler / headless-browser User-Agent patterns.
 * Matched case-insensitively. Real browsers never contain these strings.
 */
const BOT_UA_PATTERNS: RegExp[] = [
  // Headless / automation runtimes
  /HeadlessChrome/i,
  /Puppeteer/i,
  /Playwright/i,
  /Selenium/i,
  /PhantomJS/i,
  /webdriver/i,
  // Scripted HTTP clients
  /python-requests/i,
  /python-httpx/i,
  /aiohttp/i,
  /Scrapy/i,
  // AI crawlers
  /GPTBot/i,
  /OAI-SearchBot/i,
  /ChatGPT-User/i,
  /ClaudeBot/i,
  /anthropic-ai/i,
  /Claude-Web/i,
  /Google-Extended/i,
  /CCBot/i,
  /Bytespider/i,
  /PetalBot/i,
  // SEO / data-harvesting bots
  /SemrushBot/i,
  /AhrefsBot/i,
  /MJ12bot/i,
  /DotBot/i,
  /DataForSeoBot/i,
  /YandexBot/i,
  /Baiduspider/i,
];

function isBotUserAgent(ua: string): boolean {
  return BOT_UA_PATTERNS.some((pattern) => pattern.test(ua));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ua = request.headers.get("user-agent") ?? "";

  // Block identified bots from game routes and level pages.
  // API routes get a 403; page routes redirect silently to login so the bot
  // cannot distinguish between "blocked" and "simply not authenticated".
  if (isBotUserAgent(ua)) {
    if (pathname.startsWith("/api/game")) {
      return new NextResponse(
        JSON.stringify({ success: false, message: "Access denied." }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }
    if (
      pathname.startsWith("/level") ||
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/leaderboard")
    ) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // Session-based route protection (unchanged)
  const sessionValue = request.cookies.get(SESSION_COOKIE)?.value ?? "";
  const hasValidCookie = sessionValue !== "" && isValidTokenFormat(sessionValue);

  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (isProtected && !hasValidCookie) {
    return NextResponse.redirect(new URL("/", request.url));
  }



  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/level/:path*",
    "/leaderboard/:path*",
    "/api/game/:path*",
  ],
};
