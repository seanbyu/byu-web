/**
 * LINE OAuth Initiation Handler
 *
 * Redirects to LINE OAuth authorization page
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { extractLocaleFromPath, toLineUiLocales } from "@/features/auth/utils/line-oauth";

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
  const returnUrl = request.nextUrl.searchParams.get("returnUrl") || "/";
  const localeFromQuery = request.nextUrl.searchParams.get("locale");
  const localeFromReturnUrl = extractLocaleFromPath(returnUrl);
  const uiLocales = toLineUiLocales(localeFromQuery || localeFromReturnUrl);
  const statePayload = JSON.stringify({
    csrf: crypto.randomUUID(),
    returnUrl,
  });
  const state = Buffer.from(statePayload).toString("base64");
  const nonce = crypto.randomUUID();

  const params = new URLSearchParams({
    response_type: "code",
    client_id: channelId,
    redirect_uri: redirectUri,
    state,
    scope: "profile openid email",
    nonce,
    ui_locales: uiLocales,
    bot_prompt: "normal",
  });

  return NextResponse.redirect(`${LINE_AUTH_URL}?${params.toString()}`);
}
