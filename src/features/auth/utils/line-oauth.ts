export type AppLocale = "ko" | "en" | "th";

const LINE_UI_LOCALE_MAP: Record<AppLocale, string> = {
  ko: "ko-KR",
  en: "en-US",
  th: "th-TH",
};

const FALLBACK_LINE_UI_LOCALE = "en-US";

export function extractLocaleFromPath(pathname: string): AppLocale | null {
  if (!pathname) return null;
  const normalizedPath = pathname.split("?")[0].split("#")[0];
  const firstSegment = normalizedPath.split("/").filter(Boolean)[0];

  if (firstSegment === "ko" || firstSegment === "en" || firstSegment === "th") {
    return firstSegment;
  }

  return null;
}

export function toLineUiLocales(locale?: string | null): string {
  if (!locale) return FALLBACK_LINE_UI_LOCALE;
  return LINE_UI_LOCALE_MAP[locale as AppLocale] || FALLBACK_LINE_UI_LOCALE;
}

export function buildLiffOpenUrl(liffId: string, returnPath: string): string {
  const baseUrl = `https://liff.line.me/${liffId}`;
  if (!returnPath || returnPath === "/") {
    return baseUrl;
  }

  return `${baseUrl}?liff.state=${encodeURIComponent(returnPath)}`;
}
