import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

// Lazy Graceful Prisma Client instantiation
function getPrismaClient() {
  try {
    return new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL || "mysql://root:password@localhost:3306/crypthunt"
        }
      }
    } as any);
  } catch (e) {
    console.error("Prisma Client initialization failed", e);
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, email, score, completedLevel, elapsedTime } = body;

    if (!username || !email) {
      return NextResponse.json(
        { success: false, message: "Missing required identifier fields: username or email." },
        { status: 400 }
      );
    }

    // Try to update user records in MySQL database via Prisma
    const prisma = getPrismaClient();
    if (prisma) {
      try {
        // Upsert User record
        const user = await prisma.user.upsert({
          where: { email },
          update: {
            username,
            score,
            currentLevel: completedLevel + 1,
            elapsedTime,
            completedAt: completedLevel >= 5 ? new Date() : null,
          },
          create: {
            username,
            email,
            password: "offline_fallback_pass",
            score,
            currentLevel: completedLevel + 1,
            elapsedTime,
            completedAt: completedLevel >= 5 ? new Date() : null,
          },
        });

        // Upsert LevelProgress record
        await prisma.levelProgress.upsert({
          where: {
            userId_level: {
              userId: user.id,
              level: completedLevel,
            },
          },
          update: {
            completed: true,
            completedAt: new Date(),
          },
          create: {
            userId: user.id,
            level: completedLevel,
            completed: true,
            completedAt: new Date(),
          },
        });

        return NextResponse.json({
          success: true,
          message: `Score matrix synchronized with MySQL database. User: ${username}`,
          databaseStatus: "CONNECTED",
          data: {
            userId: user.id,
            score: user.score,
            currentLevel: user.currentLevel,
          },
        });
      } catch (dbError: any) {
        console.warn(
          "MySQL connection offline or schema not migrated yet. Falling back to local state.",
          dbError.message
        );
        return NextResponse.json({
          success: true,
          message: "Local state persistent. Database offline. Please configure DATABASE_URL in .env and run 'npx prisma db push'.",
          databaseStatus: "OFFLINE_FALLBACK",
          data: { username, email, score, completedLevel, elapsedTime },
        });
      }
    } else {
      return NextResponse.json({
        success: true,
        message: "Prisma client not configured. Local state persistent.",
        databaseStatus: "OFFLINE_FALLBACK",
        data: { username, email, score, completedLevel, elapsedTime },
      });
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Internal server error parsing request payload.", error: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const prisma = getPrismaClient();
    if (prisma) {
      try {
        const users = await prisma.user.findMany({
          select: {
            username: true,
            email: true,
            score: true,
            currentLevel: true,
            elapsedTime: true,
          },
          orderBy: [
            { currentLevel: "desc" },
            { score: "desc" },
            { elapsedTime: "asc" }
          ]
        });

        // Convert db list to Leaderboard entries (currentLevel - 1 is completed levels)
        const entries = users.map(u => ({
          username: u.username,
          email: u.email,
          score: u.score,
          completedLevels: Math.max(0, u.currentLevel - 1),
          elapsedTime: u.elapsedTime
        }));

        return NextResponse.json({
          success: true,
          databaseStatus: "CONNECTED",
          data: entries
        });
      } catch (dbError: any) {
        console.warn("MySQL connection offline fetching leaderboard", dbError.message);
        return NextResponse.json({
          success: true,
          databaseStatus: "OFFLINE_FALLBACK",
          data: []
        });
      }
    } else {
      return NextResponse.json({
        success: true,
        databaseStatus: "OFFLINE_FALLBACK",
        data: []
      });
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Internal server error fetching scores.", error: error.message },
      { status: 500 }
    );
  }
}
