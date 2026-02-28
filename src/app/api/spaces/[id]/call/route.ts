/**
 * POST /api/spaces/[id]/call  — start (or get) the active call session
 * DELETE /api/spaces/[id]/call — end the active call session
 *
 * Provider-agnostic: the `provider` body field (or env default) selects
 * which VOIP SDK is used to create the room. Token generation is handled
 * by the separate /token sub-route so participants can join independently.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { VoipProvider } from "@prisma/client";

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Create a room on the VOIP provider and return its external room ID. */
async function createProviderRoom(
  provider: VoipProvider,
  spaceId: string
): Promise<{ providerRoomId: string; providerMeta?: object }> {
  switch (provider) {
    case "DAILY": {
      // https://docs.daily.co/reference/rest-api/rooms/create-room
      const res = await fetch("https://api.daily.co/v1/rooms", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: `bookworm-${spaceId}`,
          privacy: "private",
          properties: { max_participants: 20, enable_chat: true },
        }),
      });
      if (!res.ok) throw new Error(`Daily.co room creation failed: ${res.status}`);
      const data = await res.json();
      return { providerRoomId: data.name, providerMeta: { url: data.url } };
    }

    case "LIVEKIT": {
      // LiveKit rooms are created implicitly on first join — just use a stable name.
      return { providerRoomId: `bookworm-${spaceId}` };
    }

    case "AGORA": {
      // Agora channels are ephemeral — channel name is sufficient.
      return {
        providerRoomId: `bookworm-${spaceId}`,
        providerMeta: { appId: process.env.AGORA_APP_ID },
      };
    }

    case "TWILIO": {
      // https://www.twilio.com/docs/video/api/rooms-resource
      const creds = Buffer.from(
        `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
      ).toString("base64");
      const body = new URLSearchParams({
        UniqueName: `bookworm-${spaceId}`,
        Type: "group",
        MaxParticipants: "20",
      });
      const res = await fetch("https://video.twilio.com/v1/Rooms", {
        method: "POST",
        headers: {
          Authorization: `Basic ${creds}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
      });
      if (!res.ok) throw new Error(`Twilio room creation failed: ${res.status}`);
      const data = await res.json();
      return { providerRoomId: data.sid };
    }

    default:
      // JITSI / HUNDREDMS — rooms are named-only, no pre-creation needed
      return { providerRoomId: `bookworm-${spaceId}` };
  }
}

// ── POST — start or retrieve active session ───────────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const spaceId = params.id;

  // Verify the caller is a member of the space
  const membership = await prisma.spaceMember.findUnique({
    where: { userId_spaceId: { userId: session.user.id, spaceId } },
  });
  if (!membership) {
    return NextResponse.json({ error: "Not a member of this space" }, { status: 403 });
  }

  // Return existing live session if one is already running
  const existing = await prisma.callSession.findUnique({
    where: { spaceId },
    include: { participants: { where: { leftAt: null } } },
  });
  if (existing && ["WAITING", "LIVE"].includes(existing.status)) {
    return NextResponse.json({ session: existing });
  }

  // Determine provider — body can override the env default
  const body = await req.json().catch(() => ({}));
  const provider: VoipProvider =
    body.provider ?? (process.env.VOIP_PROVIDER as VoipProvider) ?? "DAILY";

  const { providerRoomId, providerMeta } = await createProviderRoom(provider, spaceId);

  const callSession = await prisma.callSession.create({
    data: {
      spaceId,
      provider,
      providerRoomId,
      providerMeta: providerMeta ?? undefined,
      status: "WAITING",
      maxParticipants: 20,
    },
  });

  return NextResponse.json({ session: callSession }, { status: 201 });
}

// ── DELETE — end the active session ──────────────────────────────────────────

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const callSession = await prisma.callSession.findUnique({
    where: { spaceId: params.id },
    include: { space: { select: { ownerId: true } } },
  });

  if (!callSession) {
    return NextResponse.json({ error: "No active session" }, { status: 404 });
  }

  // Only the space owner or a moderator may end the session
  const isOwner = callSession.space.ownerId === session.user.id;
  const isMod = await prisma.spaceMember.findFirst({
    where: {
      spaceId: params.id,
      userId: session.user.id,
      role: { in: ["OWNER", "MODERATOR"] },
    },
  });
  if (!isOwner && !isMod) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();
  const durationSec = callSession.startedAt
    ? Math.floor((now.getTime() - callSession.startedAt.getTime()) / 1000)
    : 0;

  const ended = await prisma.callSession.update({
    where: { id: callSession.id },
    data: {
      status: "ENDED",
      endedAt: now,
      durationSec,
    },
  });

  // Mark all participants still in the call as left
  await prisma.callParticipant.updateMany({
    where: { sessionId: callSession.id, leftAt: null },
    data: { leftAt: now },
  });

  return NextResponse.json({ session: ended });
}
