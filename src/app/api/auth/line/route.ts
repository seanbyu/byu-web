/**
 * LINE OAuth Initiation Handler
 *
 * Redirects to LINE OAuth authorization page
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const LINE_AUTH_URL = "https://access.line.me/oauth2/v2.1/authorize";

export async function GET(request: NextRequest) {
  const channelId = process.env.LINE_CHANNEL_ID;

  if (!channelId) {
    return NextResponse.json(
      { error: "LINE_CHANNEL_ID is not configured" },
      { status: 500 }
    );
  }

  const origin = request.nextUrl.origin;
  const redirectUri = `${origin}/api/auth/line/callback`;
  const state = crypto.randomUUID();
  const nonce = crypto.randomUUID();

  const params = new URLSearchParams({
    response_type: "code",
    client_id: channelId,
    redirect_uri: redirectUri,
    state,
    scope: "profile openid email",
    nonce,
  });

  return NextResponse.redirect(`${LINE_AUTH_URL}?${params.toString()}`);
}
