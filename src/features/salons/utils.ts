import type { Salon } from "@/lib/supabase/types";
import { getDayName } from "@/features/bookings/utils";

export type SalonStatus = "open" | "preparing" | "closed" | "holiday";

// Get salon status: "open" | "preparing" | "closed" | "holiday"
export function getSalonStatus(businessHours: Salon["business_hours"]): SalonStatus {
  if (!businessHours) return "holiday";

  const today = getDayName(new Date());
  const todayHours = businessHours[today];

  if (!todayHours?.enabled || !todayHours.open || !todayHours.close) {
    return "holiday";
  }

  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  const [openHour, openMin] = todayHours.open.split(":").map(Number);
  const [closeHour, closeMin] = todayHours.close.split(":").map(Number);
  const openTime = openHour * 60 + openMin;
  const closeTime = closeHour * 60 + closeMin;

  if (currentTime >= openTime && currentTime <= closeTime) {
    return "open";
  }
  if (currentTime >= openTime - 60 && currentTime < openTime) {
    return "preparing";
  }
  if (currentTime > closeTime) {
    return "closed";
  }
  return "closed";
}

// Get today's business hours as string (e.g., "10:00 - 19:00")
export function getTodayHours(businessHours: Salon["business_hours"]): string | null {
  if (!businessHours) return null;

  const today = getDayName(new Date());
  const todayHours = businessHours[today];

  if (!todayHours?.enabled || !todayHours.open || !todayHours.close) {
    return null;
  }

  return `${todayHours.open} - ${todayHours.close}`;
}

export function getLocaleCode(locale: string): string {
  const localeMap: Record<string, string> = {
    ko: "ko-KR",
    en: "en-US",
    th: "th-TH",
  };
  return localeMap[locale] || "en-US";
}
