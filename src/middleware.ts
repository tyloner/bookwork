/**
 * Next.js Edge Middleware
 *
 * Responsibilities (in order):
 *  1. Block oversized request bodies before they reach route handlers
 *  2. Rate-limit by IP — tight on auth endpoints, relaxed elsewhere
 *  3. Enforce authentication on protected routes via NextAuth
 *  4. Reject CORS preflight early so handlers don't need to handle it
 *
 * Security headers are set globally in next.config.js (applied to every
 * response including static assets), not here, so they are never missed.
 */

import { withAuth, NextRequestWithAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { rateLimit, tooManyRequests, getClientIp, LIMITS } from "@/lib/rate-limit";

// ── Route classification ──────────────────────────────────────────────────────

/** Pages that require a valid session (redirect to sign-in if missing) */
const PROTECTED_PAGES = [
  "/spaces/create",
  "/matches",
  "/profile",
  "/settings",
  "/premium",
  "/onboarding",
];

/** API routes that require a session (return 401 if missing) */
const PROTECTED_API = [
  "/api/user/",
  "/api/matches/",
  "/api/stripe/",
  "/api/notifications/",
  "/api/spaces/",
];

/** Auth endpoints — tightest rate limit to prevent brute-force / enumeration */
const AUTH_PATHS = [
  "/api/auth/callback/credentials",
  "/api/auth/signin",
  "/api/auth/register",
];

/** Webhook paths — skip session auth, signature verification inside handler */
const WEBHOOK_PATHS = ["/api/webhooks/", "/api/stripe/webhook"];

// ── Max request body size guard (Content-Length header check) ─────────────────
const MAX_BODY_BYTES = 1_048_576; // 1 MB

function bodyTooLarge(req: Request): boolean {
  const len = req.headers.get("content-length");
  return !!len && parseInt(len, 10) > MAX_BODY_BYTES;
}

// ── Middleware ────────────────────────────────────────────────────────────────

export default withAuth(
  function middleware(req: NextRequestWithAuth) {
    const { pathname } = req.nextUrl;
    const ip = getClientIp(req);

    // 1. Body size guard
    if (bodyTooLarge(req)) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }

    // 2. Rate limiting — separate buckets so one class can't exhaust another
    const isAuthPath = AUTH_PATHS.some((p) => pathname.startsWith(p));
    const isWebhook = WEBHOOK_PATHS.some((p) => pathname.startsWith(p));
    const isApi = pathname.startsWith("/api/");

    if (isAuthPath) {
      const r = rateLimit(`auth:${ip}`, LIMITS.AUTH);
      if (!r.allowed) return tooManyRequests(r.retryAfterMs);
    } else if (isWebhook) {
      const r = rateLimit(`webhook:${ip}`, LIMITS.WEBHOOK);
      if (!r.allowed) return tooManyRequests(r.retryAfterMs);
    } else if (isApi) {
      const r = rateLimit(`api:${ip}`, LIMITS.API);
      if (!r.allowed) return tooManyRequests(r.retryAfterMs);
    }

    // 3. CORS preflight — answer early so handlers stay clean
    if (req.method === "OPTIONS") {
      return new NextResponse(null, { status: 204 });
    }

    // 4. Soft-delete fence — blocked/deleted users are signed out
    if (req.nextauth.token?.deletedAt) {
      const url = req.nextUrl.clone();
      url.pathname = "/auth/signin";
      url.searchParams.set("error", "AccountDeleted");
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  },
  {
    pages: { signIn: "/auth/signin" },

    callbacks: {
      authorized({ token, req }) {
        const { pathname } = req.nextUrl;

        // Webhooks are public — auth is done via signature in the handler
        if (WEBHOOK_PATHS.some((p) => pathname.startsWith(p))) return true;

        // Auth routes always public
        if (pathname.startsWith("/auth/")) return true;

        // Protected pages require a session
        if (PROTECTED_PAGES.some((p) => pathname.startsWith(p))) return !!token;

        // Protected API routes require a session (returns 401, not redirect)
        if (PROTECTED_API.some((p) => pathname.startsWith(p))) return !!token;

        return true;
      },
    },
  }
);

// Run on every request except Next.js internals and static files
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.json|icons/).*)"],
};
