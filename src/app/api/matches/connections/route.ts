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

    // Get accepted matches
    const matches = await prisma.match.findMany({
      where: {
        status: "ACCEPTED",
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      include: {
        sender: {
          select: { id: true, name: true, image: true, bio: true },
        },
        receiver: {
          select: { id: true, name: true, image: true, bio: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    // Format connections
    const connections = matches.map((m) => {
      const other = m.senderId === userId ? m.receiver : m.sender;
      return {
        matchId: m.id,
        user: other,
        bookContext: m.bookContext,
        message: m.message,
        matchedAt: m.updatedAt,
      };
    });

    // Deduplicate by user ID
    const seen = new Set<string>();
    const unique = connections.filter((c) => {
      if (seen.has(c.user.id)) return false;
      seen.add(c.user.id);
      return true;
    });

    return NextResponse.json({ connections: unique });
  } catch (error) {
    console.error("Error fetching connections:", error);
    return NextResponse.json(
      { error: "Failed to fetch connections" },
      { status: 500 }
    );
  }
}
