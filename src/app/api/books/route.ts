import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    if (!search) {
      return NextResponse.json({ books: [] });
    }

    const books = await prisma.book.findMany({
      where: {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { author: { contains: search, mode: "insensitive" } },
        ],
      },
      take: 10,
      orderBy: { title: "asc" },
    });

    return NextResponse.json({ books });
  } catch (error) {
    console.error("Error fetching books:", error);
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

    const { title, author, isbn, coverUrl, description, genre, pageCount, language } =
      await request.json();

    if (!title || !author) {
      return NextResponse.json(
        { error: "Title and author are required" },
        { status: 400 }
      );
    }

    // Try to find existing book first
    const existing = isbn
      ? await prisma.book.findUnique({ where: { isbn } })
      : await prisma.book.findFirst({
          where: {
            title: { equals: title, mode: "insensitive" },
            author: { equals: author, mode: "insensitive" },
          },
        });

    if (existing) {
      return NextResponse.json(existing);
    }

    const book = await prisma.book.create({
      data: {
        title,
        author,
        isbn,
        coverUrl,
        description,
        genre: genre || [],
        pageCount,
        language: language || "en",
      },
    });

    return NextResponse.json(book, { status: 201 });
  } catch (error) {
    console.error("Error creating book:", error);
    return NextResponse.json(
      { error: "Failed to create book" },
      { status: 500 }
    );
  }
}
