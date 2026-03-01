import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;

    const space = await prisma.space.findUnique({
      where: { id: params.id },
      include: { _count: { select: { members: true } } },
    });

    if (!space) {
      return NextResponse.json({ error: "Space not found" }, { status: 404 });
    }

    if (!space.isActive) {
      return NextResponse.json(
        { error: "This space is no longer active" },
        { status: 400 }
      );
    }

    if (space._count.members >= space.maxMembers) {
      return NextResponse.json(
        { error: "This space is full" },
        { status: 400 }
      );
    }

    // Enforce ACTIVE_READERS_ONLY rule
    if (space.rules.includes("ACTIVE_READERS_ONLY")) {
      const isReading = await prisma.userBook.findFirst({
        where: { userId, bookId: space.bookId, status: "READING" },
      });
      if (!isReading) {
        return NextResponse.json(
          { error: "This space requires you to be actively reading the book. Add it to your reading list with status READING to join." },
          { status: 403 }
        );
      }
    }

    const existing = await prisma.spaceMember.findUnique({
      where: { userId_spaceId: { userId, spaceId: params.id } },
    });

    if (existing) {
      return NextResponse.json(
        { error: "You are already a member" },
        { status: 400 }
      );
    }

    const member = await prisma.spaceMember.create({
      data: {
        userId,
        spaceId: params.id,
        role: "MEMBER",
      },
    });

    // Create system message
    await prisma.message.create({
      data: {
        content: `${session.user.name || "Someone"} joined the space`,
        type: "SYSTEM",
        userId,
        spaceId: params.id,
      },
    });

    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    console.error("Error joining space:", error);
    return NextResponse.json(
      { error: "Failed to join space" },
      { status: 500 }
    );
  }
}
