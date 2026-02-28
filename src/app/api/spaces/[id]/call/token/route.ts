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

async function getLiveKitToken(roomName: string, userId: string, isOwner: boolean) {
  // LiveKit uses a signed JWT — install `livekit-server-sdk` for production.
  // This stub shows the shape; replace with AccessToken from the SDK.
  const { AccessToken } = await import(/* webpackIgnore: true */ "livekit-server-sdk").catch(() => {
    throw new Error("livekit-server-sdk not installed. Run: npm i livekit-server-sdk");
  });

  const at = new AccessToken(
    process.env.LIVEKIT_API_KEY!,
    process.env.LIVEKIT_API_SECRET!,
    { identity: userId, ttl: TOKEN_TTL_SECONDS }
  );
  at.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: isOwner,
    canSubscribe: true,
  });

  const token = await at.toJwt();
  const expiresAt = new Date(Date.now() + TOKEN_TTL_SECONDS * 1000).toISOString();
  return { token, expiresAt };
}

async function getAgoraToken(channelName: string, userId: string) {
  // Agora tokens are generated with the RtcTokenBuilder from agora-access-token.
  // Install: npm i agora-access-token
  const { RtcTokenBuilder, RtcRole } = await import(/* webpackIgnore: true */ "agora-access-token").catch(() => {
    throw new Error("agora-access-token not installed. Run: npm i agora-access-token");
  });

  const uid = Math.floor(Math.random() * 100000); // Agora uses numeric UIDs
  const expiresAt = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS;
  const token = RtcTokenBuilder.buildTokenWithUid(
    process.env.AGORA_APP_ID!,
    process.env.AGORA_APP_CERTIFICATE!,
    channelName,
    uid,
    RtcRole.PUBLISHER,
    expiresAt
  );

  return {
    token,
    uid,
    expiresAt: new Date(expiresAt * 1000).toISOString(),
  };
}

async function getTwilioToken(roomSid: string, userId: string) {
  // Twilio uses an AccessToken with a VideoGrant — install: npm i twilio
  const twilio = await import(/* webpackIgnore: true */ "twilio").catch(() => {
    throw new Error("twilio not installed. Run: npm i twilio");
  });

  const { AccessToken } = twilio.default.jwt;
  const { VideoGrant } = AccessToken;

  const token = new AccessToken(
    process.env.TWILIO_ACCOUNT_SID!,
    process.env.TWILIO_API_KEY!,
    process.env.TWILIO_API_SECRET!,
    { identity: userId, ttl: TOKEN_TTL_SECONDS }
  );
  token.addGrant(new VideoGrant({ room: roomSid }));

  const expiresAt = new Date(Date.now() + TOKEN_TTL_SECONDS * 1000).toISOString();
  return { token: token.toJwt(), expiresAt };
}

// ── GET handler ───────────────────────────────────────────────────────────────

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

  // Register / update participant record
  await prisma.callParticipant.upsert({
    where: {
      // Use sessionId + userId as a logical unique key
      // (multiple rows allowed for reconnects — use findFirst in practice)
      sessionId_userId: { sessionId: callSession.id, userId },
    },
    create: {
      sessionId: callSession.id,
      userId,
      providerUid: tokenData.uid ? String(tokenData.uid) : undefined,
      role: isOwner ? "HOST" : "LISTENER",
      joinedAt: new Date(),
    },
    update: {
      providerUid: tokenData.uid ? String(tokenData.uid) : undefined,
      joinedAt: new Date(),
      leftAt: null,
    },
  });

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
