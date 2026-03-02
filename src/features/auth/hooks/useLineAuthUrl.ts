"use client";

import { useState, useEffect } from "react";
import { useLocale } from "next-intl";
import { toLineUiLocales } from "../utils/line-oauth";

/**
 * LINE OAuth authorize URL을 <a> 태그용으로 빌드하는 hook
 *
 * iOS에서 Universal Link가 작동하려면 유저가 직접 클릭한 <a href>여야 함.
 * <button onClick={() => window.location.href = url> 방식은
 * JavaScript redirect로 간주되어 LINE 앱이 열리지 않음.
 */
function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function useLineAuthUrl(): string {
  const [url, setUrl] = useState("#");
  const locale = useLocale();

  useEffect(() => {
    const channelId = process.env.NEXT_PUBLIC_LINE_CHANNEL_ID;
    const returnUrl = window.location.pathname + window.location.search;
    const uiLocales = toLineUiLocales(locale);

    if (!channelId) {
      const fallback = `/api/auth/line?returnUrl=${encodeURIComponent(returnUrl)}&locale=${encodeURIComponent(locale)}`;
      setUrl(fallback);
      return;
    }

    const redirectUri = `${window.location.origin}/api/auth/line/callback`;
    const csrf = generateUUID();
    const nonce = generateUUID();
    const state = btoa(JSON.stringify({ csrf, returnUrl }));

    sessionStorage.setItem("line_oauth_state", csrf);

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

    setUrl(`https://access.line.me/oauth2/v2.1/authorize?${params.toString()}`);
  }, [locale]);

  return url;
}
