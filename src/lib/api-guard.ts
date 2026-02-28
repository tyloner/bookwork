/**
 * API route helpers — auth, authorization, input validation, safe responses.
 *
 * Every route handler should start with:
 *
 *   const { session, error } = await requireAuth();
 *   if (error) return error;
 *
 * Then for ownership checks:
 *
 *   const { membership, error } = await requireSpaceMembership(session.user.id, spaceId);
 *   if (error) return error;
 *
 * And for input validation:
 *
 *   const { data, error } = await guard.body(req, createSpaceSchema);
 *   if (error) return error;
 */

import { getServerSession, Session } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, tooManyRequests, getClientIp, LIMITS } from "@/lib/rate-limit";
import { parseBody, parseQuery } from "@/lib/validate";
import type { z } from "zod";

// ── Typed session ─────────────────────────────────────────────────────────────

type AuthedSession = Session & { user: { id: string; email: string; name?: string | null } };

// ── Auth guard ────────────────────────────────────────────────────────────────

type AuthResult =
  | { session: AuthedSession; error?: never }
  | { session?: never; error: NextResponse };

/**
 * Require a valid session. Returns the session or a 401 response.
 * Also accepts a per-handler rate limit override (e.g. LIMITS.MATCH).
 */
export async function requireAuth(
  req?: Request,
  limitOverride?: typeof LIMITS[keyof typeof LIMITS]
): Promise<AuthResult> {
  // Optional per-handler rate limiting (on top of middleware limit)
  if (req && limitOverride) {
    const ip = getClientIp(req);
    const result = rateLimit(`handler:${ip}:${req.url}`, limitOverride);
    if (!result.allowed) {
      return { error: tooManyRequests(result.retryAfterMs) };
    }
  }

  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return {
      error: NextResponse.json({ error: "Authentication required" }, { status: 401 }),
    };
  }

  return { session: session as AuthedSession };
}

// ── Ownership guards ──────────────────────────────────────────────────────────

type SpaceMemberResult =
  | { membership: { role: string }; error?: never }
  | { membership?: never; error: NextResponse };

/** Verify the user is an active member of the given space. */
export async function requireSpaceMembership(
  userId: string,
  spaceId: string
): Promise<SpaceMemberResult> {
  const membership = await prisma.spaceMember.findUnique({
    where: { userId_spaceId: { userId, spaceId } },
    select: { role: true },
  });

  if (!membership) {
    return {
      error: NextResponse.json({ error: "You are not a member of this space" }, { status: 403 }),
    };
  }

  return { membership };
}

type SpaceOwnerResult =
  | { space: { id: string; ownerId: string }; error?: never }
  | { space?: never; error: NextResponse };

/** Verify the user owns the space or is a moderator. */
export async function requireSpaceMod(
  userId: string,
  spaceId: string
): Promise<SpaceOwnerResult> {
  const space = await prisma.space.findUnique({
    where: { id: spaceId },
    select: { id: true, ownerId: true },
  });

  if (!space) {
    return { error: NextResponse.json({ error: "Space not found" }, { status: 404 }) };
  }

  if (space.ownerId !== userId) {
    // Also allow moderators
    const mod = await prisma.spaceMember.findFirst({
      where: { spaceId, userId, role: { in: ["OWNER", "MODERATOR"] } },
    });
    if (!mod) {
      return { error: NextResponse.json({ error: "Insufficient permissions" }, { status: 403 }) };
    }
  }

  return { space };
}

/** Verify the user owns the resource (generic — pass the ownerId from DB). */
export function requireOwnership(
  userId: string,
  ownerId: string,
  resource = "resource"
): NextResponse | null {
  if (userId !== ownerId) {
    return NextResponse.json({ error: `You do not own this ${resource}` }, { status: 403 });
  }
  return null;
}

/** Verify the user is PREMIUM tier. */
export async function requirePremium(userId: string): Promise<NextResponse | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { tier: true, tierExpiresAt: true },
  });

  const isActive =
    user?.tier === "PREMIUM" &&
    (!user.tierExpiresAt || user.tierExpiresAt > new Date());

  if (!isActive) {
    return NextResponse.json(
      { error: "This feature requires a Premium subscription" },
      { status: 402 }
    );
  }

  return null;
}

// ── Input validation shortcuts ────────────────────────────────────────────────

type ValidationResult<T> =
  | { data: T; error?: never }
  | { data?: never; error: NextResponse };

/** Parse and validate a JSON request body. */
export async function parseRequestBody<T extends z.ZodTypeAny>(
  req: Request,
  schema: T
): Promise<ValidationResult<z.infer<T>>> {
  const result = await parseBody(req, schema);
  if (result.error) {
    return {
      error: NextResponse.json(
        { error: "Validation failed", details: result.error },
        { status: 422 }
      ),
    };
  }
  return { data: result.data };
}

/** Parse and validate URL search params. */
export function parseRequestQuery<T extends z.ZodTypeAny>(
  searchParams: URLSearchParams,
  schema: T
): ValidationResult<z.infer<T>> {
  const result = parseQuery(searchParams, schema);
  if (result.error) {
    return {
      error: NextResponse.json(
        { error: "Invalid query parameters", details: result.error },
        { status: 400 }
      ),
    };
  }
  return { data: result.data };
}

// ── Safe response helpers ─────────────────────────────────────────────────────

/** Strip sensitive fields from a User object before sending to the client. */
export function sanitizeUser<T extends Record<string, unknown>>(user: T) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, stripeCustomerId, stripeSubId, deletedAt, ...safe } = user as Record<string, unknown>;
  return safe;
}

/** Catch-all error handler for route handlers. Avoids leaking stack traces. */
export function handleRouteError(err: unknown): NextResponse {
  console.error("[API Error]", err);

  // Prisma: record not found
  if (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: string }).code === "P2025"
  ) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Prisma: unique constraint violation
  if (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: string }).code === "P2002"
  ) {
    return NextResponse.json({ error: "Already exists" }, { status: 409 });
  }

  return NextResponse.json(
    { error: "An unexpected error occurred" },
    { status: 500 }
  );
}
