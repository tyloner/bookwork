/**
 * POST /api/webhooks/[provider]
 *
 * Single ingestion endpoint for all VOIP provider webhooks.
 * Each provider signs its payload differently — verify the signature
 * first, then normalise the event into a standard shape and act on it.
 *
 * Supported providers: daily | livekit | agora | twilio | stripe
 *
 * Every inbound event is logged to WebhookLog before processing so
 * replayed events are deduplicated via the (source, externalId) unique key.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { WebhookSource, Prisma } from "@prisma/client";

// ── Signature verifiers ───────────────────────────────────────────────────────

async function verifyDaily(req: NextRequest, rawBody: string): Promise<boolean> {
  const sig = req.headers.get("x-daily-signature");
  if (!sig || !process.env.DAILY_WEBHOOK_SECRET) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(process.env.DAILY_WEBHOOK_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );
  const sigBytes = Buffer.from(sig.replace("sha256=", ""), "hex");
  return crypto.subtle.verify("HMAC", key, sigBytes, new TextEncoder().encode(rawBody));
}

async function verifyLiveKit(req: NextRequest, rawBody: string): Promise<boolean> {
  // LiveKit signs with a JWT Authorization header — validate with livekit-server-sdk
  // For now, verify the secret token matches
  const auth = req.headers.get("authorization") ?? "";
  return auth === `Bearer ${process.env.LIVEKIT_WEBHOOK_SECRET}`;
}

function verifyTwilio(req: NextRequest): boolean {
  // Twilio sends X-Twilio-Signature — validate with twilio.validateRequest
  // Simplified: ensure the header exists for now; use twilio SDK in production
  return !!req.headers.get("x-twilio-signature");
}

// ── Event normalisers ─────────────────────────────────────────────────────────

type NormalisedEvent = {
  externalId: string;
  eventType: string;
  roomId?: string;         // provider's room identifier
  participantId?: string;  // provider's participant identifier
};

function normaliseDailyEvent(payload: Record<string, unknown>): NormalisedEvent {
  return {
    externalId: payload.id as string,
    eventType: payload.action as string,
    roomId: (payload.room as Record<string, unknown>)?.name as string,
    participantId: (payload.participant as Record<string, unknown>)?.user_id as string,
  };
}

function normaliseLiveKitEvent(payload: Record<string, unknown>): NormalisedEvent {
  return {
    externalId: `${payload.event}-${(payload.room as Record<string, unknown>)?.name}-${Date.now()}`,
    eventType: payload.event as string,
    roomId: (payload.room as Record<string, unknown>)?.name as string,
    participantId: (payload.participant as Record<string, unknown>)?.identity as string,
  };
}

function normaliseAgoraEvent(payload: Record<string, unknown>): NormalisedEvent {
  return {
    externalId: payload.noticeId as string,
    eventType: String(payload.eventType),
    roomId: payload.cname as string,
    participantId: String(payload.uid),
  };
}

function normaliseTwilioEvent(payload: Record<string, string>): NormalisedEvent {
  return {
    externalId: payload.StatusCallbackEvent + "-" + payload.RoomSid,
    eventType: payload.StatusCallbackEvent,
    roomId: payload.RoomSid,
    participantId: payload.ParticipantSid,
  };
}

// ── Side-effects ──────────────────────────────────────────────────────────────

async function handleRoomEnded(roomId: string) {
  const session = await prisma.callSession.findFirst({
    where: { providerRoomId: roomId, status: { in: ["LIVE", "WAITING"] } },
  });
  if (!session) return;

  const now = new Date();
  await prisma.callSession.update({
    where: { id: session.id },
    data: {
      status: "ENDED",
      endedAt: now,
      durationSec: session.startedAt
        ? Math.floor((now.getTime() - session.startedAt.getTime()) / 1000)
        : 0,
    },
  });

  await prisma.callParticipant.updateMany({
    where: { sessionId: session.id, leftAt: null },
    data: { leftAt: now },
  });
}

async function handleParticipantLeft(roomId: string, providerUid: string) {
  const session = await prisma.callSession.findFirst({
    where: { providerRoomId: roomId },
  });
  if (!session) return;

  await prisma.callParticipant.updateMany({
    where: { sessionId: session.id, providerUid, leftAt: null },
    data: { leftAt: new Date() },
  });
}

// ── POST handler ──────────────────────────────────────────────────────────────

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { provider: string } }
) {
  const rawBody = await req.text();
  const providerKey = params.provider.toLowerCase();

  // Map URL segment → WebhookSource enum value
  const sourceMap: Record<string, WebhookSource> = {
    daily: "DAILY",
    livekit: "LIVEKIT",
    agora: "AGORA",
    twilio: "TWILIO",
    stripe: "STRIPE",
  };
  const source = sourceMap[providerKey];
  if (!source) {
    return NextResponse.json({ error: "Unknown provider" }, { status: 400 });
  }

  // Verify signature
  let verified = false;
  switch (providerKey) {
    case "daily":
      verified = await verifyDaily(req, rawBody);
      break;
    case "livekit":
      verified = await verifyLiveKit(req, rawBody);
      break;
    case "twilio":
      verified = verifyTwilio(req);
      break;
    case "agora":
      // Agora uses a plain token in the header
      verified = req.headers.get("x-agora-token") === process.env.AGORA_WEBHOOK_TOKEN;
      break;
    case "stripe":
      // Stripe has its own route at /api/stripe/webhook — redirect there in practice
      verified = !!req.headers.get("stripe-signature");
      break;
  }

  if (!verified) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // Parse payload
  let payload: Record<string, unknown>;
  try {
    payload =
      providerKey === "twilio"
        ? Object.fromEntries(new URLSearchParams(rawBody))
        : JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  // Normalise
  let event: NormalisedEvent;
  switch (providerKey) {
    case "daily":   event = normaliseDailyEvent(payload); break;
    case "livekit": event = normaliseLiveKitEvent(payload); break;
    case "agora":   event = normaliseAgoraEvent(payload); break;
    case "twilio":  event = normaliseTwilioEvent(payload as Record<string, string>); break;
    default:        event = { externalId: Date.now().toString(), eventType: "unknown" };
  }

  // Idempotency — skip if already processed
  const existing = await prisma.webhookLog.findUnique({
    where: { source_externalId: { source, externalId: event.externalId } },
  });
  if (existing?.status === "PROCESSED") {
    return NextResponse.json({ ok: true, deduplicated: true });
  }

  // Log the event
  const log = await prisma.webhookLog.upsert({
    where: { source_externalId: { source, externalId: event.externalId } },
    create: {
      source,
      eventType: event.eventType,
      externalId: event.externalId,
      payload: payload as Prisma.InputJsonValue,
      status: "PENDING",
    },
    update: { payload: payload as Prisma.InputJsonValue, status: "PENDING" },
  });

  // Dispatch side-effects
  try {
    const type = event.eventType.toLowerCase();

    if (type.includes("room-ended") || type.includes("roomfinished") || type === "101") {
      if (event.roomId) await handleRoomEnded(event.roomId);
    } else if (type.includes("participant-left") || type.includes("participantdisconnected") || type === "103") {
      if (event.roomId && event.participantId) {
        await handleParticipantLeft(event.roomId, event.participantId);
      }
    }
    // Add further event types here as needed

    await prisma.webhookLog.update({
      where: { id: log.id },
      data: { status: "PROCESSED", processedAt: new Date() },
    });
  } catch (err) {
    await prisma.webhookLog.update({
      where: { id: log.id },
      data: {
        status: "FAILED",
        error: err instanceof Error ? err.message : String(err),
      },
    });
    // Return 200 so provider doesn't retry immediately — we'll reprocess from the log
  }

  return NextResponse.json({ ok: true });
}
