/**
 * Prisma client singleton.
 *
 * Connection strategy:
 *
 *  Serverless (Vercel / AWS Lambda / Edge):
 *    Set DATABASE_URL to a Prisma Accelerate URL or a PgBouncer-pooled URL.
 *    Accelerate handles pooling externally so connection_limit=1 is correct —
 *    each Lambda invocation only needs one connection to the pooler.
 *
 *    DATABASE_URL="prisma://accelerate.prisma-data.net/?api_key=..."
 *    DIRECT_URL="postgresql://..."  ← migrations only (prisma migrate dev)
 *
 *  Traditional server (Railway / Render / VPS):
 *    Keep a standard postgresql:// URL. The singleton below reuses the
 *    connection pool across requests within the same process.
 *
 * Why connection_limit matters:
 *    Postgres defaults to 100 max connections. Without a limit, each
 *    serverless cold-start allocates up to 10 connections (Prisma default).
 *    At 15 concurrent cold-starts you hit the ceiling. Setting limit=1
 *    (serverless) or 5-10 (long-running) keeps you safely under.
 */

import { PrismaClient } from "@prisma/client";

function createPrismaClient() {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "warn", "error"]
        : ["error"],
    // connection_limit is set via the DATABASE_URL query param, e.g.:
    // postgresql://...?connection_limit=1&pool_timeout=5
    // Do not set it here so it can be tuned per environment.
  });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// In development, reuse the client across hot-reloads to avoid exhausting
// the connection pool during `next dev`. In production each process gets
// its own singleton — external pooling (Accelerate / PgBouncer) handles
// multiplexing across Lambda invocations.
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
