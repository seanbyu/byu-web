import { memo, useState, useMemo } from "react";
import { Calendar, Clock, ChevronRight } from "lucide-react";
import { TimeSlotsSkeleton } from "@/components/ui/Skeleton";
import { getDayName, isDateInHolidays, getDesignerWorkHours } from "../utils";
import type { HolidayEntry } from "@/lib/supabase/types";
import type { DateTimeStepProps } from "../types";

type BusinessHoursMap = Record<string, { enabled?: boolean; open?: string; close?: string }> | null;

export const DateTimeStep = memo(function DateTimeStep({
  availableDates,
  timeSlots,
  selectedDate,
  selectedTime,
  onSelectDate,
  onSelectTime,
  loadingSlots,
  salon,
  selectedDesigner,
  t,
}: DateTimeStepProps) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const daysInMonth = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: (Date | null)[] = [];

    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  }, [currentMonth]);

  const isDateAvailable = (date: Date) => {
    if (isDateInHolidays(date, salon.holidays as HolidayEntry[] | null)) return false;

    const dayName = getDayName(date);
    const bh = salon.business_hours as BusinessHoursMap;
    const hours = bh?.[dayName];
    if (!hours?.enabled) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return false;

    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + ((salon.settings as Record<string, unknown> | null)?.booking_advance_days as number || 30));
    if (date > maxDate) return false;

    // Check designer's work schedule and holidays
    if (selectedDesigner) {
      if (isDateInHolidays(date, selectedDesigner.staff_profiles?.holidays || null)) return false;
      const designerHours = getDesignerWorkHours(selectedDesigner, dayName);
      if (designerHours.status === "day_off") return false;
    }

    return true;
  };

  return (
    <div>
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Calendar className="w-5 h-5 text-primary-500" />
        {t("selectDateTime")}
      </h2>

      {/* Calendar */}
      <div className="bg-gray-50 rounded-xl p-4 mb-6">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
            className="touch-target rounded-lg p-2 hover:bg-gray-200"
          >
            <ChevronRight className="w-5 h-5 rotate-180" />
          </button>
          <span className="font-medium">
            {currentMonth.getFullYear()}년 {currentMonth.getMonth() + 1}월
          </span>
          <button
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
            className="touch-target rounded-lg p-2 hover:bg-gray-200"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["일", "월", "화", "수", "목", "금", "토"].map((day, i) => (
            <div
              key={day}
              className={`text-center text-xs font-medium py-2 ${
                i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : "text-gray-500"
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {daysInMonth.map((date, index) => {
            if (!date) {
              return <div key={`empty-${index}`} className="h-11" />;
            }

            const available = isDateAvailable(date);
            const isSelected = selectedDate?.toDateString() === date.toDateString();
            const isToday = date.toDateString() === new Date().toDateString();

            return (
              <button
                key={date.toISOString()}
                onClick={() => available && onSelectDate(date)}
                disabled={!available}
                className={`h-11 rounded-lg text-sm font-medium transition-colors ${
                  isSelected
                    ? "bg-primary-600 text-white"
                    : available
                    ? isToday
                      ? "bg-primary-100 text-primary-600 hover:bg-primary-200"
                      : "hover:bg-gray-200"
                    : "text-gray-300 cursor-not-allowed"
                }`}
              >
                {date.getDate()}
              </button>
            );
          })}
        </div>
      </div>

      {/* Time Slots */}
      {selectedDate && (
        <div>
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary-500" />
            {t("selectTime")}
          </h3>

          {loadingSlots ? (
            <TimeSlotsSkeleton />
          ) : timeSlots.length > 0 ? (
            <div className="grid grid-cols-4 gap-1">
              {timeSlots.map(({ time, available }) => (
                <button
                  key={time}
                  onClick={() => available && onSelectTime(time)}
                  disabled={!available}
                  className={`min-h-8 rounded-md px-0.5 py-1 text-[11px] font-medium leading-none transition-colors sm:min-h-9 sm:rounded-lg sm:px-1 sm:py-1.5 sm:text-xs ${
                    selectedTime === time
                      ? "bg-primary-600 text-white"
                      : available
                      ? "bg-gray-100 hover:bg-gray-200"
                      : "bg-gray-50 text-gray-300 cursor-not-allowed line-through"
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              {t("noTimeSlotsAvailable")}
            </div>
          )}
        </div>
      )}
    </div>
  );
});
