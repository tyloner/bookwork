import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const genre = searchParams.get("genre");
    const language = searchParams.get("language");
    const author = searchParams.get("author");
    const dateRange = searchParams.get("dateRange");
    const type = searchParams.get("type");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: Record<string, unknown> = { isActive: true };

    if (genre) {
      where.genre = { has: genre };
    }

    if (language) {
      where.language = language;
    }

    if (type && type !== "all") {
      where.type = type;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { book: { title: { contains: search, mode: "insensitive" } } },
        { book: { author: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (author) {
      where.book = { ...((where.book as object) || {}), author: { contains: author, mode: "insensitive" } };
    }

    if (dateRange && dateRange !== "all") {
      const now = new Date();
      let dateFilter: Date;
      switch (dateRange) {
        case "today":
          dateFilter = new Date(now.setHours(0, 0, 0, 0));
          break;
        case "week":
          dateFilter = new Date(now.setDate(now.getDate() - 7));
          break;
        case "month":
          dateFilter = new Date(now.setMonth(now.getMonth() - 1));
          break;
        default:
          dateFilter = new Date(0);
      }
      where.createdAt = { gte: dateFilter };
    }

    const [spaces, total] = await Promise.all([
      prisma.space.findMany({
        where,
        include: {
          book: true,
          owner: { select: { id: true, name: true, image: true } },
          members: { select: { userId: true } },
          _count: { select: { messages: true, members: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.space.count({ where }),
    ]);

    return NextResponse.json({
      spaces,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching spaces:", error);
    return NextResponse.json(
      { error: "Failed to fetch spaces" },
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
    const body = await request.json();
    const { name, description, bookId, type, maxMembers, language, genre, scheduledAt, duration } = body;

    if (!name || !bookId) {
      return NextResponse.json(
        { error: "Name and book are required" },
        { status: 400 }
      );
    }

    const space = await prisma.space.create({
      data: {
        name,
        description,
        bookId,
        ownerId: userId,
        type: type || "CHAT",
        maxMembers: maxMembers || 20,
        language: language || "en",
        genre: genre || [],
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        duration: duration || null,
        members: {
          create: {
            userId,
            role: "OWNER",
          },
        },
      },
      include: {
        book: true,
        owner: { select: { id: true, name: true, image: true } },
        _count: { select: { messages: true, members: true } },
      },
    });

    return NextResponse.json(space, { status: 201 });
  } catch (error) {
    console.error("Error creating space:", error);
    return NextResponse.json(
      { error: "Failed to create space" },
      { status: 500 }
    );
  }
}
