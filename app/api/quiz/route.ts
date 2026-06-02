import { NextResponse } from "next/server";
import { requirePrismaClient } from "@/lib/server/prisma";

/**
 * Public leaderboard. Returns usernames and scores only — no emails.
 * GET is intentionally unauthenticated (public scoreboard).
 * POST is removed; level advancement is handled by /api/game/complete-level.
 */
export async function GET() {
  try {
    const prisma = requirePrismaClient();
    const users = await prisma.user.findMany({
      select: { username: true, score: true, currentLevel: true, updatedAt: true },
      orderBy: [{ currentLevel: "desc" }, { score: "desc" }, { updatedAt: "asc" }],
    });

    const entries = users.map((u) => ({
      username: u.username,
      score: u.score,
      completedLevels: Math.max(0, u.currentLevel - 1),
      updatedAt: u.updatedAt.toISOString(),
    }));

    return NextResponse.json({ success: true, data: entries });
  } catch {
    return NextResponse.json(
      { success: false, message: "Unable to fetch leaderboard." },
      { status: 503 }
    );
  }
}
