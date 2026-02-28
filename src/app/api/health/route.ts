/**
 * GET /api/health  (also /health via vercel.json rewrite)
 *
 * Liveness probe used by uptime monitors and load balancers.
 * Checks that the database is reachable with a minimal query.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Cheapest possible query — just checks the connection is alive
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch {
    return NextResponse.json({ status: "degraded", db: "unreachable" }, { status: 503 });
  }
}
