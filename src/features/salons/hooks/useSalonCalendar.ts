import { useMemo, useEffect, useRef, useCallback } from "react";
import { useShallow } from "zustand/react/shallow";
import { useTranslations } from "next-intl";
import type { Salon, StaffWithProfile } from "@/lib/supabase/types";
import { getDayName, isDateInHolidays, getDesignerWorkHours } from "@/features/bookings/utils";
import { useSalonDetailStore } from "../stores/useSalonDetailStore";

export function useSalonCalendar(salon: Salon) {
  const tCommon = useTranslations("common");

  // Zustand store에서 상태 가져오기
  const {
    selectedDate,
    setSelectedDate,
    showCalendar,
    setShowCalendar,
    calendarMonth,
    setCalendarMonth,
  } = useSalonDetailStore(
    useShallow((state) => ({
      selectedDate: state.selectedDate,
      setSelectedDate: state.setSelectedDate,
      showCalendar: state.showCalendar,
      setShowCalendar: state.setShowCalendar,
      calendarMonth: state.calendarMonth,
      setCalendarMonth: state.setCalendarMonth,
    }))
  );

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
  }, [showCalendar, setShowCalendar]);

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

  const isSalonHoliday = useCallback((date: Date): boolean => {
    return isDateInHolidays(date, salon.holidays);
  }, [salon.holidays]);

  const isDesignerHoliday = useCallback((designer: StaffWithProfile, date: Date): boolean => {
    if (isDateInHolidays(date, designer.staff_profiles?.holidays || null)) return true;
    const dayName = getDayName(date);
    const workResult = getDesignerWorkHours(designer, dayName);
    return workResult.status === "day_off";
  }, []);

  const isDateEnabled = useCallback((date: Date): boolean => {
    if (isDateInHolidays(date, salon.holidays)) return false;
    const dayName = getDayName(date);
    const hours = salon.business_hours?.[dayName];
    return !!(hours?.enabled && hours.open && hours.close);
  }, [salon.holidays, salon.business_hours]);

  const isCalendarDateAvailable = useCallback((date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return false;

    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + (salon.settings?.booking_advance_days || 30));
    if (date > maxDate) return false;

    if (isDateInHolidays(date, salon.holidays)) return false;
    const dayName = getDayName(date);
    const hours = salon.business_hours?.[dayName];
    return !!(hours?.enabled && hours.open && hours.close);
  }, [salon.settings?.booking_advance_days, salon.holidays, salon.business_hours]);

  const getDayLabel = useCallback((date: Date) => {
    const dayName = getDayName(date);
    return tCommon(`days.${dayName}`);
  }, [tCommon]);

  const getOpeningTime = useCallback((date: Date) => {
    if (isDateInHolidays(date, salon.holidays)) return null;
    const dayName = getDayName(date);
    const hours = salon.business_hours?.[dayName];
    return hours?.enabled && hours.open ? hours.open : null;
  }, [salon.holidays, salon.business_hours]);

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
