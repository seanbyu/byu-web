import { useMemo, useEffect, useRef, useCallback } from "react";
import { useShallow } from "zustand/react/shallow";
import { useTranslations } from "next-intl";
import type { Salon, StaffWithProfile, HolidayEntry } from "@/lib/supabase/types";
import { getDayName, isDateInHolidays, getDesignerWorkHours } from "@/features/bookings/utils";

type BusinessHoursMap = Record<string, { enabled?: boolean; open?: string; close?: string }> | null;
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

    const settings = salon.settings as Record<string, unknown> | null;
    const advanceDays = (settings?.booking_advance_days as number) || 30;
    for (let i = 0; i < advanceDays; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    return dates;
  }, [salon.settings]);

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
    return isDateInHolidays(date, salon.holidays as HolidayEntry[] | null);
  }, [salon.holidays]);

  const isDesignerHoliday = useCallback((designer: StaffWithProfile, date: Date): boolean => {
    if (isDateInHolidays(date, designer.staff_profiles?.holidays || null)) return true;
    const dayName = getDayName(date);
    const workResult = getDesignerWorkHours(designer, dayName);
    return workResult.status === "day_off";
  }, []);

  const isDateEnabled = useCallback((date: Date): boolean => {
    if (isDateInHolidays(date, salon.holidays as HolidayEntry[] | null)) return false;
    const dayName = getDayName(date);
    const bh = salon.business_hours as BusinessHoursMap;
    const hours = bh?.[dayName];
    return !!(hours?.enabled && hours.open && hours.close);
  }, [salon.holidays, salon.business_hours]);

  const isCalendarDateAvailable = useCallback((date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return false;

    const settings = salon.settings as Record<string, unknown> | null;
    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + ((settings?.booking_advance_days as number) || 30));
    if (date > maxDate) return false;

    if (isDateInHolidays(date, salon.holidays as HolidayEntry[] | null)) return false;
    const dayName = getDayName(date);
    const bh = salon.business_hours as BusinessHoursMap;
    const hours = bh?.[dayName];
    return !!(hours?.enabled && hours.open && hours.close);
  }, [salon.settings, salon.holidays, salon.business_hours]);

  const getDayLabel = useCallback((date: Date) => {
    const dayName = getDayName(date);
    return tCommon(`days.${dayName}`);
  }, [tCommon]);

  const getOpeningTime = useCallback((date: Date) => {
    if (isDateInHolidays(date, salon.holidays as HolidayEntry[] | null)) return null;
    const dayName = getDayName(date);
    const bh = salon.business_hours as BusinessHoursMap;
    const hours = bh?.[dayName];
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
