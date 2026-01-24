"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Home,
  Search,
  Share2,
  MapPin,
  Phone,
  Clock,
  Star,
  ChevronRight,
  Calendar,
} from "lucide-react";
import { Link } from "@/i18n/routing";
import type { Salon, StaffWithProfile } from "@/lib/supabase/types";

type Props = {
  salon: Salon;
  staff: StaffWithProfile[];
};

// Get today's day name
function getTodayName(): string {
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  return days[new Date().getDay()];
}

// Check if salon is currently open
function isOpen(businessHours: Salon["business_hours"]): boolean {
  if (!businessHours) return false;

  const today = getTodayName();
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

// Format business hours for display
function formatBusinessHours(businessHours: Salon["business_hours"]): { day: string; hours: string; isToday: boolean }[] {
  if (!businessHours) return [];

  const dayOrder = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  const dayLabels: Record<string, string> = {
    monday: "월",
    tuesday: "화",
    wednesday: "수",
    thursday: "목",
    friday: "금",
    saturday: "토",
    sunday: "일",
  };

  const today = getTodayName();

  return dayOrder.map((day) => {
    const hours = businessHours[day];
    return {
      day: dayLabels[day],
      hours: hours?.enabled && hours.open && hours.close
        ? `${hours.open} - ${hours.close}`
        : "휴무",
      isToday: day === today,
    };
  });
}

export function SalonDetailView({ salon, staff }: Props) {
  const t = useTranslations("salon");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const open = isOpen(salon.business_hours);
  const businessHours = formatBusinessHours(salon.business_hours);

  return (
    <div className="bg-white min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="flex items-center justify-between px-4 h-14">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Link href="/" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <Home className="w-5 h-5" />
            </Link>
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <Search className="w-5 h-5" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Cover Image */}
      <div className="relative h-72 bg-gradient-to-br from-purple-100 to-pink-100">
        {salon.cover_image_url ? (
          <img
            src={salon.cover_image_url}
            alt={salon.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-8xl font-bold text-purple-200">
              {salon.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        {/* Status Badge */}
        <div
          className={`absolute bottom-4 left-4 px-3 py-1.5 rounded-full text-sm font-medium shadow-lg ${
            open
              ? "bg-green-500 text-white"
              : "bg-gray-800 text-white"
          }`}
        >
          {open ? t("open") : t("closed")}
        </div>
      </div>

      {/* Salon Info */}
      <div className="p-4">
        {/* Logo & Name */}
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm">
            {salon.logo_url ? (
              <img
                src={salon.logo_url}
                alt={salon.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-2xl font-bold text-gray-400">
                {salon.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-900">{salon.name}</h1>
            {salon.description && (
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                {salon.description}
              </p>
            )}
            {/* Plan Badge */}
            {salon.plan_type !== "FREE" && (
              <span className="inline-block mt-2 px-2 py-0.5 bg-purple-50 text-purple-600 text-xs font-medium rounded">
                {salon.plan_type}
              </span>
            )}
          </div>
        </div>

        {/* Quick Info */}
        <div className="mt-6 space-y-3">
          {salon.address && (
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-gray-700">
                  {salon.address}
                  {salon.city && `, ${salon.city}`}
                  {salon.country && `, ${salon.country}`}
                </p>
              </div>
            </div>
          )}
          {salon.phone && (
            <a
              href={`tel:${salon.phone}`}
              className="flex items-center gap-3 group"
            >
              <Phone className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-700 group-hover:text-purple-600 transition-colors">
                {salon.phone}
              </span>
            </a>
          )}
          {salon.email && (
            <a
              href={`mailto:${salon.email}`}
              className="flex items-center gap-3 group"
            >
              <span className="w-5 h-5 text-gray-400 text-center">@</span>
              <span className="text-sm text-gray-700 group-hover:text-purple-600 transition-colors">
                {salon.email}
              </span>
            </a>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="h-2 bg-gray-50" />

      {/* Business Hours Section */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-500" />
            {t("hours")}
          </h2>
        </div>
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="grid grid-cols-7 gap-1 text-center">
            {businessHours.map((item) => (
              <div
                key={item.day}
                className={`py-2 rounded-lg ${
                  item.isToday
                    ? "bg-purple-100 text-purple-700"
                    : "text-gray-600"
                }`}
              >
                <div className="text-xs font-medium mb-1">{item.day}</div>
                <div className={`text-[10px] ${item.hours === "휴무" ? "text-gray-400" : ""}`}>
                  {item.hours === "휴무" ? "휴무" : item.hours.split(" - ")[0]}
                </div>
              </div>
            ))}
          </div>
          {/* Today's full hours */}
          {businessHours.find(h => h.isToday) && (
            <div className="mt-3 pt-3 border-t border-gray-200 text-center">
              <span className="text-sm text-gray-600">
                오늘 영업시간:{" "}
                <span className="font-medium text-gray-900">
                  {businessHours.find(h => h.isToday)?.hours}
                </span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="h-2 bg-gray-50" />

      {/* Designers Section - 예약 가능한 직원만 표시 */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Star className="w-5 h-5 text-purple-500" />
            디자이너
          </h2>
          {staff.length > 3 && (
            <button className="text-sm text-purple-600 flex items-center gap-1">
              {tCommon("viewAll")}
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {staff.length > 0 ? (
            staff.map((designer) => (
              <div
                key={designer.id}
                className="flex-shrink-0 w-24 text-center"
              >
                <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden">
                  {designer.profile_image ? (
                    <img
                      src={designer.profile_image}
                      alt={designer.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-bold text-gray-400">
                      {designer.name.charAt(0)}
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm font-medium text-gray-700 truncate">
                  {designer.name}
                </p>
                <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
                  {designer.staff_profiles?.years_of_experience && (
                    <>
                      <span>경력 {designer.staff_profiles.years_of_experience}년</span>
                    </>
                  )}
                </div>
                {designer.staff_profiles?.specialties && designer.staff_profiles.specialties.length > 0 && (
                  <p className="text-[10px] text-purple-500 mt-1 truncate">
                    {designer.staff_profiles.specialties[0]}
                  </p>
                )}
              </div>
            ))
          ) : (
            <div className="w-full text-center py-8 text-gray-400">
              <p>현재 예약 가능한 디자이너가 없습니다</p>
            </div>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="h-2 bg-gray-50" />

      {/* Salon Details Section */}
      <div className="p-4">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-purple-500" />
          {t("info")}
        </h2>
        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">통화</span>
            <span className="font-medium">{salon.settings?.currency || "KRW"}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">타임존</span>
            <span className="font-medium">{salon.settings?.timezone || "Asia/Seoul"}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">예약 가능 기간</span>
            <span className="font-medium">{salon.settings?.booking_advance_days || 30}일 전</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">예약 단위</span>
            <span className="font-medium">{salon.settings?.slot_duration_minutes || 30}분</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">취소 가능 시간</span>
            <span className="font-medium">{salon.settings?.booking_cancellation_hours || 24}시간 전</span>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 max-w-[448px] mx-auto">
        <button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors">
          <Calendar className="w-5 h-5" />
          예약하기
        </button>
      </div>
    </div>
  );
}
