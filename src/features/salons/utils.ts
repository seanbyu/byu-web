import type { Salon } from "@/lib/supabase/types";
import { getDayName } from "@/features/bookings/utils";

export function isOpen(businessHours: Salon["business_hours"]): boolean {
  if (!businessHours) return false;

  const today = getDayName(new Date());
  const todayHours = businessHours[today];

  if (!todayHours?.enabled || !todayHours.open || !todayHours.close) {
    return false;
  }

  const now = new Date();
  const currentTime = now.getHours() * 100 + now.getMinutes();
  const openTime = parseInt(todayHours.open.replace(":", ""));
  const closeTime = parseInt(todayHours.close.replace(":", ""));

  return currentTime >= openTime && currentTime <= closeTime;
}

export function getLocaleCode(locale: string): string {
  const localeMap: Record<string, string> = {
    ko: "ko-KR",
    en: "en-US",
    th: "th-TH",
  };
  return localeMap[locale] || "en-US";
}
