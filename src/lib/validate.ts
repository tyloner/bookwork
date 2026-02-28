/**
 * Zod schemas for every API input surface.
 *
 * Rules:
 *  - Strings are always .trim()med — prevents whitespace-only values
 *  - Free-text fields cap at reasonable maxes to prevent DB bloat
 *  - IDs are validated as cuid() so random strings can't probe the DB
 *  - Enum values are the exact Prisma enum strings so TS stays in sync
 */

import { z } from "zod";

// ── Shared primitives ─────────────────────────────────────────────────────────

const cuid = z.string().cuid("Invalid ID format");
const email = z.string().email("Invalid email address").toLowerCase().trim();
const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password too long")
  .regex(/[A-Z]/, "Must contain an uppercase letter")
  .regex(/[0-9]/, "Must contain a number");

const languageCode = z
  .string()
  .length(2, "Language must be a 2-letter ISO code")
  .toLowerCase();

// ── Auth ──────────────────────────────────────────────────────────────────────

export const registerSchema = z.object({
  email,
  password,
  name: z.string().min(2).max(60).trim(),
});

export const credentialsSignInSchema = z.object({
  email,
  password: z.string().min(1, "Password is required"),
});

// ── User / Profile ────────────────────────────────────────────────────────────

export const updateProfileSchema = z
  .object({
    name: z.string().min(2).max(60).trim().optional(),
    bio: z.string().max(500).trim().optional(),
    location: z.string().max(100).trim().optional(),
    language: languageCode.optional(),
    favoriteGenres: z.array(z.string().max(50)).max(10).optional(),
    currentlyReading: z.string().max(200).trim().optional().nullable(),
    readingGoal: z.number().int().min(1).max(365).optional(),
  })
  .strict(); // reject unknown keys

export const updateDataSourceSchema = z.object({
  field: z.enum(["name", "image"]),
  // Marking a field as USER-owned prevents SSO sync from overwriting it
  source: z.enum(["USER", "GOOGLE", "APPLE", "SYSTEM"]),
});

// ── Books ─────────────────────────────────────────────────────────────────────

export const searchBooksSchema = z.object({
  q: z.string().min(1).max(200).trim(),
  language: languageCode.optional(),
  genre: z.string().max(50).optional(),
  page: z.coerce.number().int().min(1).max(100).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const addUserBookSchema = z.object({
  bookId: cuid,
  status: z.enum(["WANT_TO_READ", "READING", "FINISHED", "ABANDONED"]),
  progress: z.number().int().min(0).max(100).default(0),
});

export const updateUserBookSchema = z.object({
  status: z.enum(["WANT_TO_READ", "READING", "FINISHED", "ABANDONED"]).optional(),
  progress: z.number().int().min(0).max(100).optional(),
  rating: z.number().int().min(1).max(5).optional(),
  notes: z.string().max(2000).trim().optional(),
});

// ── Spaces ────────────────────────────────────────────────────────────────────

export const createSpaceSchema = z.object({
  name: z
    .string()
    .min(3, "Space name must be at least 3 characters")
    .max(100)
    .trim(),
  description: z.string().max(1000).trim().optional(),
  bookId: cuid,
  type: z.enum(["CHAT", "CALL", "HYBRID"]),
  language: languageCode,
  genre: z.array(z.string().max(50)).min(1).max(5),
  maxMembers: z.number().int().min(2).max(50).default(20),
  scheduledAt: z.string().datetime().optional(), // ISO-8601
  isPrivate: z.boolean().default(false),
});

export const updateSpaceSchema = z
  .object({
    name: z.string().min(3).max(100).trim().optional(),
    description: z.string().max(1000).trim().optional().nullable(),
    maxMembers: z.number().int().min(2).max(50).optional(),
    isPrivate: z.boolean().optional(),
    scheduledAt: z.string().datetime().optional().nullable(),
  })
  .strict();

export const listSpacesSchema = z.object({
  genre: z.string().max(50).optional(),
  language: languageCode.optional(),
  type: z.enum(["all", "CHAT", "CALL", "HYBRID"]).default("all"),
  dateRange: z.enum(["all", "today", "week", "month"]).default("all"),
  search: z.string().max(200).trim().optional(),
  page: z.coerce.number().int().min(1).max(200).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

// ── Messages ──────────────────────────────────────────────────────────────────

export const sendMessageSchema = z.object({
  content: z
    .string()
    .min(1, "Message cannot be empty")
    .max(5_000, "Message too long")
    .trim(),
  type: z.enum(["TEXT", "IMAGE"]).default("TEXT"),
  replyToId: cuid.optional(),
});

export const listMessagesSchema = z.object({
  before: z.string().datetime().optional(), // cursor-based pagination
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

// ── Matching ──────────────────────────────────────────────────────────────────

export const sendMatchSchema = z.object({
  receiverId: cuid,
  bookContext: cuid.optional(),
  message: z.string().max(500).trim().optional(),
});

export const respondMatchSchema = z.object({
  status: z.enum(["ACCEPTED", "REJECTED"]),
});

// ── VOIP ──────────────────────────────────────────────────────────────────────

export const startCallSchema = z.object({
  provider: z
    .enum(["AGORA", "TWILIO", "DAILY", "LIVEKIT", "JITSI", "HUNDREDMS"])
    .optional(), // defaults to VOIP_PROVIDER env var
  recordingEnabled: z.boolean().default(false),
});

// ── Stripe ────────────────────────────────────────────────────────────────────

export const checkoutSchema = z.object({
  priceId: z.string().startsWith("price_", "Invalid Stripe price ID"),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

// ── Notifications ─────────────────────────────────────────────────────────────

export const markNotificationSchema = z.object({
  ids: z.array(cuid).min(1).max(100),
  read: z.boolean(),
});

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Parse and validate a URLSearchParams object against a Zod schema.
 * Returns { data } on success or { error, status } on failure.
 */
export function parseQuery<T extends z.ZodTypeAny>(
  searchParams: URLSearchParams,
  schema: T
): { data: z.infer<T>; error?: never } | { error: string; data?: never } {
  const raw = Object.fromEntries(searchParams.entries());
  const result = schema.safeParse(raw);
  if (!result.success) {
    const msg = result.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
    return { error: msg };
  }
  return { data: result.data };
}

/**
 * Parse and validate a JSON request body against a Zod schema.
 */
export async function parseBody<T extends z.ZodTypeAny>(
  req: Request,
  schema: T
): Promise<{ data: z.infer<T>; error?: never } | { error: string; data?: never }> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return { error: "Invalid JSON body" };
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    const msg = result.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
    return { error: msg };
  }
  return { data: result.data };
}
