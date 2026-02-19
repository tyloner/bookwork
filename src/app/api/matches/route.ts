import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: Fetch potential matches (readers with similar books)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;

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

    // Find readers with the same books
    const potentialMatches = await prisma.user.findMany({
      where: {
        id: { notIn: Array.from(excludeIds) },
        userBooks: {
          some: {
            bookId: { in: bookIds },
            status: "READING",
          },
        },
      },
      include: {
        userBooks: {
          where: { status: "READING" },
          include: { book: true },
          take: 5,
        },
      },
      take: 20,
    });

    // Format for the frontend
    const profiles = potentialMatches.map((user) => {
      const sharedBooks = user.userBooks
        .filter((ub) => bookIds.includes(ub.bookId))
        .map((ub) => ub.book);

      return {
        id: user.id,
        name: user.name,
        image: user.image,
        bio: user.bio,
        location: user.location,
        favoriteGenres: user.favoriteGenres,
        currentlyReading: user.userBooks.map((ub) => ({
          title: ub.book.title,
          author: ub.book.author,
          coverUrl: ub.book.coverUrl,
          progress: ub.progress,
        })),
        sharedBooks: sharedBooks.map((b) => ({
          title: b.title,
          author: b.author,
        })),
        booksReadThisYear: user.booksReadThisYear,
      };
    });

    return NextResponse.json({ profiles });
  } catch (error) {
    console.error("Error fetching potential matches:", error);
    return NextResponse.json(
      { error: "Failed to fetch matches" },
      { status: 500 }
    );
  }
}

// POST: Send a match request (like/pass)
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
      select: { tier: true, matchesLeftToday: true, lastMatchReset: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Reset daily counter if needed
    const now = new Date();
    const lastReset = new Date(user.lastMatchReset);
    if (
      now.getDate() !== lastReset.getDate() ||
      now.getMonth() !== lastReset.getMonth()
    ) {
      await prisma.user.update({
        where: { id: userId },
        data: { matchesLeftToday: user.tier === "PREMIUM" ? 999 : 5, lastMatchReset: now },
      });
      user.matchesLeftToday = user.tier === "PREMIUM" ? 999 : 5;
    }

    if (user.tier === "FREE" && user.matchesLeftToday <= 0) {
      return NextResponse.json(
        { error: "Daily match limit reached. Upgrade to Premium for unlimited matches." },
        { status: 429 }
      );
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

        // Decrement counter
        await prisma.user.update({
          where: { id: userId },
          data: { matchesLeftToday: { decrement: 1 } },
        });

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

      // Decrement counter
      await prisma.user.update({
        where: { id: userId },
        data: { matchesLeftToday: { decrement: 1 } },
      });

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
