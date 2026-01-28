import { memo } from "react";
import type { RefObject } from "react";
import { useTranslations } from "next-intl";
import { Clock, Calendar, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import type { Salon } from "@/lib/supabase/types";
import { getDayName, formatTime } from "@/features/bookings/utils";
import { getLocaleCode } from "../utils";

type Props = {
  salon: Salon;
  locale: string;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  showCalendar: boolean;
  setShowCalendar: (show: boolean) => void;
  calendarMonth: Date;
  setCalendarMonth: (month: Date) => void;
  calendarRef: RefObject<HTMLDivElement | null>;
  availableDates: Date[];
  calendarDays: (Date | null)[];
  isDateEnabled: (date: Date) => boolean;
  isCalendarDateAvailable: (date: Date) => boolean;
  getDayLabel: (date: Date) => string;
  isSalonHoliday: (date: Date) => boolean;
};

type BusinessHoursCardProps = {
  salon: Salon;
  selectedDate: Date;
  isSalonHoliday: (date: Date) => boolean;
};

const BusinessHoursCard = memo(function BusinessHoursCard({
  salon,
  selectedDate,
  isSalonHoliday,
}: BusinessHoursCardProps) {
  const t = useTranslations("salon");
  const tCommon = useTranslations("common");

  const dayName = getDayName(selectedDate);
  const hours = salon.business_hours?.[dayName];
  const isHoliday = isSalonHoliday(selectedDate) || !hours?.enabled;
  const slotDuration = salon.settings?.slot_duration_minutes || 60;

  const dayKeys = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;
  const regularHolidays = dayKeys
    .filter((d) => salon.business_hours?.[d] && !salon.business_hours[d].enabled)
    .map((d) => tCommon(`days.${d}`));

  if (isHoliday) {
    return (
      <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-4">
        <div className="text-center text-red-500 font-medium">
          {t("holiday")}
        </div>
        {regularHolidays.length > 0 && (
          <div className="mt-2 pt-2 border-t border-red-100 flex justify-between text-sm">
            <span className="text-gray-500">{t("regularHoliday")}</span>
            <span className="text-gray-700">{t("everyWeek")} {regularHolidays.join(", ")}</span>
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
    <div className="bg-primary-50 border border-primary-100 rounded-xl p-4 mb-4 space-y-2 text-sm">
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
}: Props) {
  const t = useTranslations("salon");
  const tCommon = useTranslations("common");
  const localeCode = getLocaleCode(locale);

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-primary-500" />
        {t("hours")}
      </h2>

      {/* Weekly Quick Selector */}
      <div className="bg-gray-50 rounded-xl p-3 mb-3">
        <div className="grid grid-cols-7 gap-1">
          {availableDates.slice(0, 7).map((date) => {
            const isSelected = date.toDateString() === selectedDate.toDateString();
            const enabled = isDateEnabled(date);
            const isToday = date.toDateString() === new Date().toDateString();

            return (
              <button
                key={date.toISOString()}
                onClick={() => enabled && setSelectedDate(date)}
                disabled={!enabled}
                className={`py-2 rounded-xl text-center transition-colors ${
                  isSelected
                    ? "bg-primary-100 border-2 border-primary-400"
                    : enabled
                    ? "hover:bg-gray-100"
                    : "opacity-50 cursor-not-allowed"
                }`}
              >
                <div className={`text-[11px] font-medium ${
                  isSelected ? "text-primary-700" : isToday ? "text-primary-600" : "text-gray-600"
                }`}>
                  {getDayLabel(date)}
                </div>
                <div className={`text-base font-bold mt-0.5 ${
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
          className="w-full bg-gray-50 rounded-xl px-4 py-3 flex items-center justify-between hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-primary-500" />
            <span className="text-sm font-medium text-gray-900">
              {selectedDate.toLocaleDateString(localeCode, { year: "numeric", month: "long", day: "numeric", weekday: "long" })}
            </span>
          </div>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showCalendar ? "rotate-180" : ""}`} />
        </button>

        {showCalendar && (
          <div className="absolute z-30 left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>
              <span className="text-sm font-semibold text-gray-900">
                {calendarMonth.toLocaleDateString(localeCode, { year: "numeric", month: "long" })}
              </span>
              <button
                onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
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
                  className={`text-center text-[10px] font-medium py-1 ${
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
                  return <div key={`empty-${index}`} className="h-9" />;
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
                    className={`h-9 rounded-lg text-sm font-medium transition-colors ${
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
