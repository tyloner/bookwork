import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const FREE_DAILY_LIMIT = 5;

// ── Quota helpers ──────────────────────────────────────────────────────────────

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Returns how many matches the user has sent today. */
async function getUsedToday(userId: string): Promise<number> {
  const today = startOfToday();
  const quota = await prisma.matchQuota.findUnique({ where: { userId } });
  if (!quota || quota.resetDate < today) return 0;
  return quota.usedToday;
}

/** Increments the match quota counter, resetting it if the date has rolled over. */
async function incrementQuota(userId: string) {
  const today = startOfToday();
  const quota = await prisma.matchQuota.findUnique({ where: { userId } });
  const needsReset = !quota || quota.resetDate < today;

  await prisma.matchQuota.upsert({
    where: { userId },
    create: { userId, usedToday: 1, resetDate: today },
    update: needsReset
      ? { usedToday: 1, resetDate: today }
      : { usedToday: { increment: 1 } },
  });
}

// ── GET: Fetch potential matches ───────────────────────────────────────────────

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;

    // Get current user's profile for scoring
    const me = await prisma.user.findUnique({
      where: { id: userId },
      select: { favoriteAuthors: true, favoriteGenres: true },
    });

    // Get user's currently reading books
    const userBooks = await prisma.userBook.findMany({
      where: { userId, status: "READING" },
      include: { book: true },
    });

    const bookIds = userBooks.map((ub) => ub.bookId);

    // Get users who already have matches (sent or received)
    const existingMatches = await prisma.match.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      select: { senderId: true, receiverId: true },
    });

    const excludeIds = new Set<string>([userId]);
    existingMatches.forEach((m) => {
      excludeIds.add(m.senderId);
      excludeIds.add(m.receiverId);
    });

    const myAuthors = me?.favoriteAuthors ?? [];
    const myGenres = me?.favoriteGenres ?? [];

    // Broadened query: shared book OR shared author OR shared genre
    const candidates = await prisma.user.findMany({
      where: {
        id: { notIn: Array.from(excludeIds) },
        deletedAt: null,
        OR: [
          ...(bookIds.length > 0
            ? [{ userBooks: { some: { bookId: { in: bookIds }, status: "READING" } } }]
            : []),
          ...(myAuthors.length > 0
            ? [{ favoriteAuthors: { hasSome: myAuthors } }]
            : []),
          ...(myGenres.length > 0
            ? [{ favoriteGenres: { hasSome: myGenres } }]
            : []),
        ],
      },
      include: {
        userBooks: {
          where: { status: "READING" },
          include: { book: true },
          take: 5,
        },
      },
      take: 50,
    });

    // Score and sort candidates in memory
    const scored = candidates
      .map((candidate) => {
        let score = 0;

        const sharedBooks = candidate.userBooks
          .filter((ub) => bookIds.includes(ub.bookId))
          .map((ub) => ub.book);
        if (sharedBooks.length > 0) score += 50;

        const sharedAuthors = candidate.favoriteAuthors.filter((a) =>
          myAuthors.includes(a)
        );
        score += Math.min(sharedAuthors.length * 30, 60);

        const sharedGenres = candidate.favoriteGenres.filter((g) =>
          myGenres.includes(g)
        );
        score += Math.min(sharedGenres.length * 10, 30);

        return { candidate, score, sharedBooks, sharedAuthors, sharedGenres };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);

    const profiles = scored.map(({ candidate, score, sharedBooks, sharedAuthors, sharedGenres }) => ({
      id: candidate.id,
      name: candidate.name,
      image: candidate.image,
      bio: candidate.bio,
      location: candidate.location,
      favoriteGenres: candidate.favoriteGenres,
      favoriteAuthors: candidate.favoriteAuthors,
      currentlyReading: candidate.userBooks.map((ub) => ({
        title: ub.book.title,
        author: ub.book.author,
        coverUrl: ub.book.coverUrl,
        progress: ub.progress,
      })),
      sharedBooks: sharedBooks.map((b) => ({ title: b.title, author: b.author })),
      sharedAuthors,
      sharedGenres,
      matchScore: score,
      booksReadThisYear: candidate.booksReadThisYear,
    }));

    return NextResponse.json({ profiles });
  } catch (error) {
    console.error("Error fetching potential matches:", error);
    return NextResponse.json(
      { error: "Failed to fetch matches" },
      { status: 500 }
    );
  }
}

// ── POST: Send a match request (like/pass) ─────────────────────────────────────

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const { receiverId, action, message } = await request.json();

    if (!receiverId || !action) {
      return NextResponse.json(
        { error: "Receiver and action are required" },
        { status: 400 }
      );
    }

    // Check daily match limit for free users
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { tier: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.tier === "FREE") {
      const usedToday = await getUsedToday(userId);
      if (usedToday >= FREE_DAILY_LIMIT) {
        return NextResponse.json(
          { error: "Daily match limit reached. Upgrade to Premium for unlimited matches." },
          { status: 429 }
        );
      }
    }

    if (action === "like") {
      // Check for mutual match
      const existingMatch = await prisma.match.findUnique({
        where: {
          senderId_receiverId: { senderId: receiverId, receiverId: userId },
        },
      });

      if (existingMatch && existingMatch.status === "PENDING") {
        // Mutual match — accept both
        await prisma.match.update({
          where: { id: existingMatch.id },
          data: { status: "ACCEPTED" },
        });

        const newMatch = await prisma.match.create({
          data: {
            senderId: userId,
            receiverId,
            status: "ACCEPTED",
            message,
          },
        });

        // Send notifications
        await prisma.notification.createMany({
          data: [
            {
              userId,
              type: "MATCH_ACCEPTED",
              title: "It's a match!",
              body: "You and another reader share a book in common.",
            },
            {
              userId: receiverId,
              type: "MATCH_ACCEPTED",
              title: "It's a match!",
              body: "You and another reader share a book in common.",
            },
          ],
        });

        await incrementQuota(userId);
        return NextResponse.json(
          { match: newMatch, isMutual: true },
          { status: 201 }
        );
      }

      // Just send a like
      const match = await prisma.match.create({
        data: {
          senderId: userId,
          receiverId,
          status: "PENDING",
          message,
        },
      });

      // Notify receiver
      await prisma.notification.create({
        data: {
          userId: receiverId,
          type: "MATCH_REQUEST",
          title: "New reader match",
          body: `Someone wants to connect with you over a book.`,
        },
      });

      await incrementQuota(userId);
      return NextResponse.json(
        { match, isMutual: false },
        { status: 201 }
      );
    }

    if (action === "pass") {
      const match = await prisma.match.create({
        data: {
          senderId: userId,
          receiverId,
          status: "REJECTED",
        },
      });

      return NextResponse.json({ match, isMutual: false }, { status: 201 });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error processing match:", error);
    return NextResponse.json(
      { error: "Failed to process match" },
      { status: 500 }
    );
  }
}
