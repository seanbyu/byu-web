"use client";

/**
 * Device Detection Utilities
 *
 * Detects mobile devices, LINE app, and provides appropriate login strategies
 */

export interface DeviceInfo {
  isMobile: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isLineApp: boolean;
  isLiffBrowser: boolean;
  userAgent: string;
}

/**
 * Detect device information from user agent
 */
export function getDeviceInfo(): DeviceInfo {
  if (typeof window === "undefined") {
    return {
      isMobile: false,
      isIOS: false,
      isAndroid: false,
      isLineApp: false,
      isLiffBrowser: false,
      userAgent: "",
    };
  }

  const ua = navigator.userAgent.toLowerCase();

  return {
    isMobile: /iphone|ipad|ipod|android|webos|blackberry|iemobile|opera mini/i.test(ua),
    isIOS: /iphone|ipad|ipod/i.test(ua),
    isAndroid: /android/i.test(ua),
    isLineApp: /line/i.test(ua),
    isLiffBrowser: /liff/i.test(ua) || window.location.href.includes("liff.state"),
    userAgent: ua,
  };
}

/**
 * Check if the device is likely to have LINE app installed
 * Note: Cannot definitively detect, but can make educated guess
 */
export function isLikelyLineInstalled(): boolean {
  const { isMobile, isLineApp } = getDeviceInfo();

  // If already in LINE app, definitely installed
  if (isLineApp) return true;

  // On mobile, LINE is commonly installed in Japan/Thailand/Taiwan
  // We assume it might be installed on mobile devices
  return isMobile;
}

/**
 * Login strategy based on device
 */
export type LoginStrategy = "line-app" | "line-web" | "web-fallback";

/**
 * Determine the best login strategy for current device
 */
export function getLoginStrategy(): LoginStrategy {
  const { isMobile, isLineApp, isLiffBrowser } = getDeviceInfo();

  // Already in LINE environment
  if (isLineApp || isLiffBrowser) {
    return "line-app";
  }

  // Mobile device - attempt LINE app launch
  if (isMobile) {
    return "line-app";
  }

  // Desktop - use web login
  return "line-web";
}

/**
 * Get appropriate LINE login URL based on strategy
 *
 * Note: When using Supabase OAuth, the redirect happens automatically
 * and LINE's server handles app detection. This is for custom implementations.
 */
export function getLineLoginUrl(
  redirectUri: string,
  state?: string
): { url: string; strategy: LoginStrategy } {
  const strategy = getLoginStrategy();
  const channelId = process.env.NEXT_PUBLIC_LINE_CHANNEL_ID;

  const params = new URLSearchParams({
    response_type: "code",
    client_id: channelId || "",
    redirect_uri: redirectUri,
    state: state || crypto.randomUUID(),
    scope: "profile openid email",
    bot_prompt: "normal",
  });

  // LINE Universal Link - automatically opens app if installed
  const baseUrl = "https://access.line.me/oauth2/v2.1/authorize";

  return {
    url: `${baseUrl}?${params.toString()}`,
    strategy,
  };
}
