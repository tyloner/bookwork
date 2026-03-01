import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  const userBook = await prisma.userBook.findUnique({
    where: { id: params.id },
    select: { userId: true },
  });

  if (!userBook) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (userBook.userId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.userBook.delete({ where: { id: params.id } });

  return NextResponse.json({ success: true });
}
