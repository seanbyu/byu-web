"use client";

import { memo } from "react";
import { useTranslations } from "next-intl";
import { MapPin, Clock, Phone, ChevronRight } from "lucide-react";
import { Link } from "@/i18n/routing";
import type { Salon } from "@/lib/supabase/types";
import { getSalonCoverUrls } from "@/lib/supabase/storage";
import { StorageImage } from "@/components/ui/StorageImage";
import type { SalonListProps, SalonCardProps } from "../types";

// Check if today is a holiday (not enabled)
function isTodayHoliday(businessHours: Salon["business_hours"]): boolean {
  if (!businessHours) return true;

  const now = new Date();
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const today = days[now.getDay()];
  const todayHours = businessHours[today];

  return !todayHours?.enabled || !todayHours.open || !todayHours.close;
}

// Check if salon is currently open (within business hours)
function isOpen(businessHours: Salon["business_hours"]): boolean {
  if (!businessHours) return false;

  const now = new Date();
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const today = days[now.getDay()];
  const todayHours = businessHours[today];

  if (!todayHours?.enabled || !todayHours.open || !todayHours.close) {
    return false;
  }

  const currentTime = now.getHours() * 100 + now.getMinutes();
  const openTime = parseInt(todayHours.open.replace(":", ""));
  const closeTime = parseInt(todayHours.close.replace(":", ""));

  return currentTime >= openTime && currentTime <= closeTime;
}

// Get today's hours
function getTodayHours(businessHours: Salon["business_hours"]): string | null {
  if (!businessHours) return null;

  const now = new Date();
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const today = days[now.getDay()];
  const todayHours = businessHours[today];

  if (!todayHours?.enabled || !todayHours.open || !todayHours.close) {
    return null;
  }

  return `${todayHours.open} - ${todayHours.close}`;
}

const SalonCard = memo(function SalonCard({ salon }: SalonCardProps) {
  const t = useTranslations("salon");
  const tCommon = useTranslations("common");
  const holiday = isTodayHoliday(salon.business_hours);
  const open = isOpen(salon.business_hours);
  const hours = getTodayHours(salon.business_hours);

  // 배지 상태: 휴무일 > 영업 중 > 준비 중
  const getBadgeStyle = () => {
    if (holiday) {
      return { className: "bg-gray-800 text-white", label: tCommon("closed") }; // 휴무
    }
    if (open) {
      return { className: "bg-green-500 text-white", label: t("open") }; // 영업 중
    }
    return { className: "bg-amber-500 text-white", label: t("beforeOpen") }; // 준비 중
  };

  const badge = getBadgeStyle();

  return (
    <Link
      href={`/salon/${salon.id}`}
      className="block bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-lg hover:border-primary-100 transition-all duration-200 active:scale-[0.99]"
    >
      {/* Cover Image */}
      <div className="relative h-40 bg-gradient-to-br from-primary-100 to-secondary-100">
        <StorageImage
          urls={getSalonCoverUrls(salon.id)}
          alt={salon.name}
          className="w-full h-full object-cover"
          fallback={
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-5xl font-bold text-primary-200">
                {salon.name.charAt(0).toUpperCase()}
              </span>
            </div>
          }
        />
        {/* Status Badge */}
        <div
          className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-medium shadow-sm ${badge.className}`}
        >
          {badge.label}
        </div>
        {/* Plan Badge */}
        {salon.plan_type !== "FREE" && (
          <div className="absolute top-3 left-3 px-2 py-1 bg-primary-600 text-white text-xs font-medium rounded-full shadow-sm">
            {salon.plan_type}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-900 truncate text-base">{salon.name}</h3>
          <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0" />
        </div>
        {salon.description && (
          <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">
            {salon.description}
          </p>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          {salon.address && (
            <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
              <MapPin className="w-3 h-3" />
              <span className="truncate max-w-[120px]">{salon.city || salon.address}</span>
            </div>
          )}
          <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
            holiday ? "bg-gray-100 text-gray-500" : open ? "bg-green-50 text-green-600" : "bg-gray-50 text-gray-500"
          }`}>
            <Clock className="w-3 h-3" />
            <span>{hours || tCommon("closed")}</span>
          </div>
        </div>

        {salon.phone && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-400">
            <Phone className="w-3 h-3" />
            <span>{salon.phone}</span>
          </div>
        )}
      </div>
    </Link>
  );
});

export const SalonList = memo(function SalonList({ salons }: SalonListProps) {
  const t = useTranslations("salon");
  const tCommon = useTranslations("common");

  if (salons.length === 0) {
    return (
      <div className="p-4">
        <h2 className="text-lg font-bold mb-4">{t("title")}</h2>
        <div className="text-center py-8 text-gray-400">
          {tCommon("noResults")}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">{t("title")}</h2>
        <span className="text-sm text-gray-400">{salons.length}개</span>
      </div>
      <div className="space-y-4">
        {salons.map((salon) => (
          <SalonCard key={salon.id} salon={salon} />
        ))}
      </div>
    </div>
  );
});
