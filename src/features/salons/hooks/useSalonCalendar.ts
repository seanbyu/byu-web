import { useState, useMemo, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import type { Salon, StaffWithProfile } from "@/lib/supabase/types";
import { getDayName, isDateInHolidays, getDesignerWorkHours } from "@/features/bookings/utils";

export function useSalonCalendar(salon: Salon) {
  const tCommon = useTranslations("common");

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const calendarRef = useRef<HTMLDivElement>(null);

  // Close calendar on outside click
  useEffect(() => {
    if (!showCalendar) return;
    const handleClick = (e: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
        setShowCalendar(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showCalendar]);

  // Generate available dates (based on booking_advance_days)
  const availableDates = useMemo(() => {
    const dates: Date[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const advanceDays = salon.settings?.booking_advance_days || 30;
    for (let i = 0; i < advanceDays; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    return dates;
  }, [salon.settings?.booking_advance_days]);

  // Calendar grid days for the current month view
  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
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
  }, [calendarMonth]);

  const isSalonHoliday = (date: Date): boolean => {
    return isDateInHolidays(date, salon.holidays);
  };

  const isDesignerHoliday = (designer: StaffWithProfile, date: Date): boolean => {
    if (isDateInHolidays(date, designer.staff_profiles?.holidays || null)) return true;
    const dayName = getDayName(date);
    const workResult = getDesignerWorkHours(designer, dayName);
    return workResult.status === "day_off";
  };

  const isDateEnabled = (date: Date): boolean => {
    if (isSalonHoliday(date)) return false;
    const dayName = getDayName(date);
    const hours = salon.business_hours?.[dayName];
    return !!(hours?.enabled && hours.open && hours.close);
  };

  const isCalendarDateAvailable = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return false;

    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + (salon.settings?.booking_advance_days || 30));
    if (date > maxDate) return false;

    return !!isDateEnabled(date);
  };

  const getDayLabel = (date: Date) => {
    const dayName = getDayName(date);
    return tCommon(`days.${dayName}`);
  };

  const getOpeningTime = (date: Date) => {
    if (isSalonHoliday(date)) return null;
    const dayName = getDayName(date);
    const hours = salon.business_hours?.[dayName];
    return hours?.enabled && hours.open ? hours.open : null;
  };

  return {
    selectedDate,
    setSelectedDate,
    showCalendar,
    setShowCalendar,
    calendarMonth,
    setCalendarMonth,
    calendarRef,
    availableDates,
    calendarDays,
    isSalonHoliday,
    isDesignerHoliday,
    isDateEnabled,
    isCalendarDateAvailable,
    getDayLabel,
    getOpeningTime,
  };
}
