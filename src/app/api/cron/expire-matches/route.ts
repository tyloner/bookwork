/**
 * GET /api/cron/expire-matches
 *
 * Runs daily at 01:00 UTC (configured in vercel.json).
 * Marks PENDING match requests older than 7 days as EXPIRED
 * so they don't clutter the receiver's inbox indefinitely.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const EXPIRY_DAYS = 7;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - EXPIRY_DAYS);

  const result = await prisma.match.updateMany({
    where: { status: "PENDING", createdAt: { lt: cutoff } },
    data: { status: "EXPIRED" },
  });

  return NextResponse.json({ expired: result.count });
}
