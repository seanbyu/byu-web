import { memo, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Clock, Calendar, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { getDayName, formatTime } from "@/features/bookings/utils";
import { getLocaleCode } from "../utils";
import type { SalonCalendarProps, BusinessHoursCardProps } from "../types";

const BusinessHoursCard = memo(function BusinessHoursCard({
  salon,
  selectedDate,
  isSalonHoliday,
}: BusinessHoursCardProps) {
  const t = useTranslations("salon");
  const tCommon = useTranslations("common");

  const dayName = getDayName(selectedDate);
  const bh = salon.business_hours as Record<string, { enabled?: boolean; open?: string; close?: string }> | null;
  const hours = bh?.[dayName];
  const isHoliday = isSalonHoliday(selectedDate) || !hours?.enabled;
  const slotDuration = (salon.settings as Record<string, unknown> | null)?.slot_duration_minutes as number || 60;

  const dayKeys = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;
  const regularHolidays = dayKeys
    .filter((d) => bh?.[d] && !bh[d].enabled)
    .map((d) => tCommon(`days.${d}`));

  if (isHoliday) {
    return (
      <div className="mb-3 rounded-xl border border-red-100 bg-red-50 p-3 sm:mb-4 sm:p-4">
        <div className="text-center text-sm font-medium text-red-500 sm:text-base">
          {t("holiday")}
        </div>
        {regularHolidays.length > 0 && (
          <div className="mt-2 flex justify-between border-t border-red-100 pt-2 text-xs sm:text-sm">
            <span className="text-gray-500">{t("regularHoliday")}</span>
            <span className="text-right text-gray-700">{t("everyWeek")} {regularHolidays.join(", ")}</span>
          </div>
        )}
      </div>
    );
  }

  const openTime = hours!.open!;
  const closeTime = hours!.close!;
  const [closeH, closeM] = closeTime.split(":").map(Number);
  const closeMinutes = closeH * 60 + closeM;
  const lastBookingTime = formatTime(closeMinutes - slotDuration);
  const unitLabel = `${slotDuration}${tCommon("minutes")}`;

  return (
    <div className="mb-4 space-y-2 rounded-xl border border-primary-100 bg-primary-50 p-3 text-xs sm:p-4 sm:text-sm">
      <div className="flex justify-between">
        <span className="text-gray-500">{t("businessHours")}</span>
        <span className="text-gray-700 font-medium">{openTime} - {closeTime}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-500">{t("lastBooking")}</span>
        <span className="text-gray-700 font-medium">{lastBookingTime}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-500">{t("bookingUnit")}</span>
        <span className="text-gray-700 font-medium">{unitLabel}</span>
      </div>
      {regularHolidays.length > 0 && (
        <div className="flex justify-between">
          <span className="text-gray-500">{t("regularHoliday")}</span>
          <span className="text-gray-700 font-medium">{t("everyWeek")} {regularHolidays.join(", ")}</span>
        </div>
      )}
    </div>
  );
});

export const SalonCalendar = memo(function SalonCalendar({
  salon,
  locale,
  selectedDate,
  setSelectedDate,
  showCalendar,
  setShowCalendar,
  calendarMonth,
  setCalendarMonth,
  calendarRef,
  availableDates,
  calendarDays,
  isDateEnabled,
  isCalendarDateAvailable,
  getDayLabel,
  isSalonHoliday,
}: SalonCalendarProps) {
  const t = useTranslations("salon");
  const tCommon = useTranslations("common");
  const localeCode = getLocaleCode(locale);

  // 선택 날짜 변경 시 해당 칩으로 자동 스크롤
  const dateStripRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!dateStripRef.current) return;
    const el = dateStripRef.current.querySelector<HTMLElement>(`[data-date-key="${selectedDate.toDateString()}"]`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [selectedDate]);

  return (
    <div className="p-3 sm:p-4">
      <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-gray-900 sm:mb-4 sm:text-lg">
        <Clock className="h-4 w-4 text-primary-500 sm:h-5 sm:w-5" />
        {t("hours")}
      </h2>

      {/* 날짜 스와이프 캐로셀 */}
      <div className="mb-3 rounded-xl bg-gray-50 p-2.5 sm:p-3">
        <div ref={dateStripRef} className="flex gap-1 overflow-x-scroll scrollbar-hide">
          {availableDates.map((date) => {
            const isSelected = date.toDateString() === selectedDate.toDateString();
            const enabled = isDateEnabled(date);
            const isToday = date.toDateString() === new Date().toDateString();

            return (
              <button
                key={date.toISOString()}
                data-date-key={date.toDateString()}
                onClick={() => enabled && setSelectedDate(date)}
                disabled={!enabled}
                className={`flex-none w-[46px] rounded-xl py-1.5 text-center transition-colors sm:w-[52px] sm:py-2 ${
                  isSelected
                    ? "bg-primary-100 border-2 border-primary-400"
                    : enabled
                    ? "hover:bg-gray-100"
                    : "opacity-50 cursor-not-allowed"
                }`}
              >
                <div className={`text-[11px] font-medium sm:text-xs ${
                  isSelected ? "text-primary-700" : isToday ? "text-primary-600" : "text-gray-600"
                }`}>
                  {getDayLabel(date)}
                </div>
                <div className={`mt-0.5 text-sm font-bold sm:text-base ${
                  isSelected ? "text-primary-700" : enabled ? "text-gray-900" : "text-gray-400"
                }`}>
                  {date.getDate()}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Calendar Dropdown Selector */}
      <div ref={calendarRef} className="relative mb-4">
        <button
          onClick={() => setShowCalendar(!showCalendar)}
          className="flex w-full items-center justify-between rounded-xl bg-gray-50 px-3 py-2.5 transition-colors hover:bg-gray-100 sm:px-4 sm:py-3"
        >
          <div className="flex items-center gap-2.5 sm:gap-3">
            <Calendar className="h-4 w-4 text-primary-500 sm:h-5 sm:w-5" />
            <span className="text-xs font-medium text-gray-900 sm:text-sm">
              {selectedDate.toLocaleDateString(localeCode, { year: "numeric", month: "long", day: "numeric", weekday: "long" })}
            </span>
          </div>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showCalendar ? "rotate-180" : ""}`} />
        </button>

        {showCalendar && (
          <div className="absolute left-0 right-0 z-30 mt-2 rounded-xl border border-gray-200 bg-white p-3 shadow-lg sm:p-4">
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}
                className="touch-target rounded-lg p-1.5 transition-colors hover:bg-gray-100"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>
              <span className="text-sm font-semibold text-gray-900">
                {calendarMonth.toLocaleDateString(localeCode, { year: "numeric", month: "long" })}
              </span>
              <button
                onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}
                className="touch-target rounded-lg p-1.5 transition-colors hover:bg-gray-100"
              >
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-1">
              {[
                tCommon("days.sunday"),
                tCommon("days.monday"),
                tCommon("days.tuesday"),
                tCommon("days.wednesday"),
                tCommon("days.thursday"),
                tCommon("days.friday"),
                tCommon("days.saturday"),
              ].map((day, i) => (
                <div
                  key={day}
                  className={`py-1 text-center text-xs font-medium ${
                    i === 0 ? "text-red-400" : i === 6 ? "text-blue-400" : "text-gray-400"
                  }`}
                >
                  {day.slice(0, 1)}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((date, index) => {
                if (!date) {
                  return <div key={`empty-${index}`} className="h-11" />;
                }

                const available = isCalendarDateAvailable(date);
                const isSelected = selectedDate.toDateString() === date.toDateString();
                const isToday = date.toDateString() === new Date().toDateString();

                return (
                  <button
                    key={date.toISOString()}
                    onClick={() => {
                      if (available) {
                        setSelectedDate(date);
                        setShowCalendar(false);
                      }
                    }}
                    disabled={!available}
                    className={`h-11 rounded-lg text-sm font-medium transition-colors ${
                      isSelected
                        ? "bg-primary-600 text-white"
                        : available
                        ? isToday
                          ? "bg-primary-50 text-primary-600 hover:bg-primary-100"
                          : "hover:bg-gray-100 text-gray-700"
                        : "text-gray-300 cursor-not-allowed"
                    }`}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Business Hours Info Card */}
      <BusinessHoursCard salon={salon} selectedDate={selectedDate} isSalonHoliday={isSalonHoliday} />
    </div>
  );
});
