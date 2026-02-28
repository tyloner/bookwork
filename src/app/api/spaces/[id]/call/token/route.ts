/**
 * GET /api/spaces/[id]/call/token
 *
 * Returns a short-lived access token for the caller to join the active
 * VOIP session. The token format is provider-specific but the response
 * shape is always the same so the client doesn't need to know which
 * provider is in use.
 *
 * Response:
 * {
 *   provider: "DAILY" | "LIVEKIT" | "AGORA" | "TWILIO" | ...
 *   token: string          — join token / JWT
 *   roomId: string         — provider's room identifier
 *   uid: number | string   — caller's identity within the room (Agora uid)
 *   expiresAt: string      — ISO timestamp
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const TOKEN_TTL_SECONDS = 3600; // 1 hour

// ── Provider token generators ─────────────────────────────────────────────────

async function getDailyToken(roomName: string, userId: string, isOwner: boolean) {
  const expiresAt = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS;
  const res = await fetch("https://api.daily.co/v1/meeting-tokens", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      properties: {
        room_name: roomName,
        user_id: userId,
        is_owner: isOwner,
        exp: expiresAt,
        enable_screenshare: isOwner,
      },
    }),
  });
  if (!res.ok) throw new Error(`Daily.co token error: ${res.status}`);
  const data = await res.json();
  return { token: data.token, expiresAt: new Date(expiresAt * 1000).toISOString() };
}

// Stub — install livekit-server-sdk and replace with real implementation
async function getLiveKitToken(
  _roomName: string,
  _userId: string,
  _isOwner: boolean
): Promise<{ token: string; expiresAt: string }> {
  throw new Error("LiveKit not configured. Install livekit-server-sdk and set LIVEKIT_API_KEY/SECRET.");
}

// Stub — install agora-access-token and replace with real implementation
async function getAgoraToken(
  _channelName: string,
  _userId: string
): Promise<{ token: string; uid: number; expiresAt: string }> {
  throw new Error("Agora not configured. Install agora-access-token and set AGORA_APP_ID/CERTIFICATE.");
}

// Stub — install twilio and replace with real implementation
async function getTwilioToken(
  _roomSid: string,
  _userId: string
): Promise<{ token: string; expiresAt: string }> {
  throw new Error("Twilio not configured. Install twilio and set TWILIO_ACCOUNT_SID/API_KEY/SECRET.");
}

// ── GET handler ───────────────────────────────────────────────────────────────

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const spaceId = params.id;
  const userId = session.user.id;

  // Must be a member
  const membership = await prisma.spaceMember.findUnique({
    where: { userId_spaceId: { userId, spaceId } },
    include: { space: { select: { ownerId: true } } },
  });
  if (!membership) {
    return NextResponse.json({ error: "Not a member of this space" }, { status: 403 });
  }

  const callSession = await prisma.callSession.findUnique({
    where: { spaceId },
  });
  if (!callSession || !["WAITING", "LIVE"].includes(callSession.status)) {
    return NextResponse.json({ error: "No active call session" }, { status: 404 });
  }

  const isOwner = membership.space.ownerId === userId;

  // Generate provider-specific token
  let tokenData: { token: string; uid?: number | string; expiresAt: string };

  switch (callSession.provider) {
    case "DAILY":
      tokenData = await getDailyToken(callSession.providerRoomId, userId, isOwner);
      break;
    case "LIVEKIT":
      tokenData = await getLiveKitToken(callSession.providerRoomId, userId, isOwner);
      break;
    case "AGORA":
      tokenData = await getAgoraToken(callSession.providerRoomId, userId);
      break;
    case "TWILIO":
      tokenData = await getTwilioToken(callSession.providerRoomId, userId);
      break;
    default:
      // JITSI / HUNDREDMS — room name is sufficient, no server token needed
      tokenData = {
        token: callSession.providerRoomId,
        expiresAt: new Date(Date.now() + TOKEN_TTL_SECONDS * 1000).toISOString(),
      };
  }

  // Register / update participant record (findFirst because reconnects can create multiple rows)
  const existing = await prisma.callParticipant.findFirst({
    where: { sessionId: callSession.id, userId },
    orderBy: { joinedAt: "desc" },
  });

  if (existing) {
    await prisma.callParticipant.update({
      where: { id: existing.id },
      data: {
        providerUid: tokenData.uid ? String(tokenData.uid) : undefined,
        joinedAt: new Date(),
        leftAt: null,
      },
    });
  } else {
    await prisma.callParticipant.create({
      data: {
        sessionId: callSession.id,
        userId,
        providerUid: tokenData.uid ? String(tokenData.uid) : undefined,
        role: isOwner ? "HOST" : "LISTENER",
        joinedAt: new Date(),
      },
    });
  }

  // Move session to LIVE if this is the first join
  if (callSession.status === "WAITING") {
    await prisma.callSession.update({
      where: { id: callSession.id },
      data: { status: "LIVE", startedAt: new Date() },
    });
  }

  return NextResponse.json({
    provider: callSession.provider,
    roomId: callSession.providerRoomId,
    token: tokenData.token,
    uid: tokenData.uid ?? userId,
    expiresAt: tokenData.expiresAt,
  });
}
