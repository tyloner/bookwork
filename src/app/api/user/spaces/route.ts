import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;

    const spaces = await prisma.space.findMany({
      where: {
        members: { some: { userId } },
      },
      include: {
        book: true,
        owner: { select: { id: true, name: true, image: true } },
        _count: { select: { messages: true, members: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ spaces });
  } catch (error) {
    console.error("Error fetching user spaces:", error);
    return NextResponse.json(
      { error: "Failed to fetch spaces" },
      { status: 500 }
    );
  }
}
