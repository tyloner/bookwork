import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  // Only premium members can vote to extend
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { tier: true },
  });

  if (!user || user.tier !== "PREMIUM") {
    return NextResponse.json(
      { error: "Only Premium members can vote to extend a space." },
      { status: 403 }
    );
  }

  const space = await prisma.space.findUnique({
    where: { id: params.id },
    select: { id: true, isActive: true, expiresAt: true, expiryDays: true, createdAt: true },
  });

  if (!space) {
    return NextResponse.json({ error: "Space not found" }, { status: 404 });
  }
  if (!space.isActive) {
    return NextResponse.json({ error: "Space is no longer active" }, { status: 400 });
  }

  // Upsert vote — idempotent
  await prisma.spaceExtensionVote.upsert({
    where: { spaceId_userId: { spaceId: params.id, userId } },
    create: { spaceId: params.id, userId },
    update: {},
  });

  const voteCount = await prisma.spaceExtensionVote.count({
    where: { spaceId: params.id },
  });

  let extended = false;
  let expiresAt = space.expiresAt;

  if (voteCount >= 3 && space.expiresAt) {
    const currentExpiry = space.expiresAt;
    const newExpiry = new Date(
      currentExpiry.getTime() + space.expiryDays * 86400000
    );
    // Hard cap: createdAt + 30 days
    const hardCap = new Date(
      space.createdAt.getTime() + 30 * 86400000
    );
    const finalExpiry = newExpiry < hardCap ? newExpiry : hardCap;

    if (finalExpiry > currentExpiry) {
      await prisma.space.update({
        where: { id: params.id },
        data: { expiresAt: finalExpiry },
      });
      expiresAt = finalExpiry;
      extended = true;
    }
  }

  return NextResponse.json({ voteCount, extended, expiresAt });
}
