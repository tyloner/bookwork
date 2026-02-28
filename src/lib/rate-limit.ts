/**
 * Sliding-window rate limiter.
 *
 * Dev / single-instance: uses an in-process Map.
 * Production / multi-region: swap the store for @upstash/ratelimit backed
 * by Upstash Redis — the interface is identical.
 *
 * Usage:
 *   import { rateLimit, LIMITS } from "@/lib/rate-limit";
 *   const result = await rateLimit(ip, LIMITS.AUTH);
 *   if (!result.allowed) return tooManyRequests(result.retryAfterMs);
 */

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number; // 0 when allowed
};

type Window = { count: number; resetAt: number };

// ── In-memory store (single process only) ────────────────────────────────────
// Replace with Upstash for serverless / multi-region deployments:
//
//   import { Ratelimit } from "@upstash/ratelimit";
//   import { Redis } from "@upstash/redis";
//   const redis = Redis.fromEnv();
//   const limiter = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(N, "1 m") });

const store = new Map<string, Window>();

// Clean up stale entries every 5 minutes to avoid unbounded memory growth
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    store.forEach((v, k) => {
      if (now > v.resetAt) store.delete(k);
    });
  }, 5 * 60 * 1000);
}

// ── Preset limits ─────────────────────────────────────────────────────────────

export const LIMITS = {
  /** Sign-in / register — tight to prevent brute-force */
  AUTH: { max: 10, windowMs: 60_000 },
  /** Webhook ingestion — generous, idempotency handles dupes */
  WEBHOOK: { max: 500, windowMs: 60_000 },
  /** General API calls */
  API: { max: 120, windowMs: 60_000 },
  /** Match swipes — mirrors DB daily allowance */
  MATCH: { max: 20, windowMs: 60_000 },
  /** Search / read-only endpoints */
  READ: { max: 300, windowMs: 60_000 },
} as const;

// ── Core function ─────────────────────────────────────────────────────────────

export function rateLimit(
  key: string,
  limit: { max: number; windowMs: number }
): RateLimitResult {
  const now = Date.now();
  const record = store.get(key);

  if (!record || now > record.resetAt) {
    store.set(key, { count: 1, resetAt: now + limit.windowMs });
    return { allowed: true, remaining: limit.max - 1, retryAfterMs: 0 };
  }

  if (record.count >= limit.max) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: record.resetAt - now,
    };
  }

  record.count += 1;
  return {
    allowed: true,
    remaining: limit.max - record.count,
    retryAfterMs: 0,
  };
}

// ── Response helper ───────────────────────────────────────────────────────────

import { NextResponse } from "next/server";

export function tooManyRequests(retryAfterMs: number): NextResponse {
  return NextResponse.json(
    { error: "Too many requests. Please slow down." },
    {
      status: 429,
      headers: {
        "Retry-After": String(Math.ceil(retryAfterMs / 1000)),
        "X-RateLimit-Limit": "exceeded",
      },
    }
  );
}

// ── IP extraction helper (works behind Vercel / Cloudflare proxies) ───────────

export function getClientIp(req: Request): string {
  const fwd = (req.headers as Headers).get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return "unknown";
}
