import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;

    const books = await prisma.userBook.findMany({
      where: { userId },
      include: { book: true },
      orderBy: { startedAt: "desc" },
    });

    return NextResponse.json({ books });
  } catch (error) {
    console.error("Error fetching user books:", error);
    return NextResponse.json(
      { error: "Failed to fetch books" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const { bookId, status, progress } = await request.json();

    if (!bookId) {
      return NextResponse.json(
        { error: "Book ID is required" },
        { status: 400 }
      );
    }

    const userBook = await prisma.userBook.upsert({
      where: { userId_bookId: { userId, bookId } },
      update: {
        status: status || "READING",
        progress: progress || 0,
      },
      create: {
        userId,
        bookId,
        status: status || "READING",
        progress: progress || 0,
      },
      include: { book: true },
    });

    return NextResponse.json(userBook, { status: 201 });
  } catch (error) {
    console.error("Error adding user book:", error);
    return NextResponse.json(
      { error: "Failed to add book" },
      { status: 500 }
    );
  }
}
