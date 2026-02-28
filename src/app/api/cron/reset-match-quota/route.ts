/**
 * POST /api/cron/reset-match-quota
 *
 * Runs daily at midnight UTC (configured in vercel.json).
 * Resets the usedToday counter for all MatchQuota rows whose
 * resetDate is before today — restoring everyone's daily swipe allowance.
 *
 * Vercel Cron authentication: Vercel automatically sets the
 * Authorization header on cron requests. We verify it matches
 * CRON_SECRET to prevent external callers triggering this.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  // Verify this is a legitimate Vercel cron call
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Reset all quotas that haven't been reset today
  const result = await prisma.matchQuota.updateMany({
    where: { resetDate: { lt: today } },
    data: { usedToday: 0, resetDate: today },
  });

  return NextResponse.json({ reset: result.count });
}
