import type { StaffWithProfile, HolidayEntry, WorkSchedule } from "@/lib/supabase/types";

export function getDayName(date: Date): string {
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  return days[date.getDay()];
}

export function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
}

export function formatDateForDB(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isDateInHolidays(date: Date, holidays: HolidayEntry[] | unknown[] | null): boolean {
  if (!holidays || holidays.length === 0) return false;
  const dateStr = formatDateForDB(date);
  return holidays.some((holiday) => {
    if (typeof holiday === "string") return holiday === dateStr;
    if (typeof holiday === "object" && holiday !== null) {
      // 단일 날짜 형식: { date: "2026-01-28" }
      if ("date" in holiday) {
        return (holiday as { date: string }).date === dateStr;
      }
      // 날짜 범위 형식: { startDate: "2026-01-28", endDate: "2026-01-31" }
      if ("startDate" in holiday && "endDate" in holiday) {
        const { startDate, endDate } = holiday as { startDate: string; endDate: string };
        return dateStr >= startDate && dateStr <= endDate;
      }
    }
    return false;
  });
}

export type DesignerWorkResult =
  | { status: "no_schedule" }
  | { status: "day_off" }
  | { status: "working"; start: string; end: string };

export function getDesignerWorkHours(
  designer: StaffWithProfile,
  dayName: string
): DesignerWorkResult {
  const workSchedule = designer.staff_profiles?.work_schedule as WorkSchedule | null;
  if (!workSchedule) return { status: "no_schedule" };
  const daySchedule = workSchedule[dayName];
  if (!daySchedule?.enabled) return { status: "day_off" };
  if (!daySchedule.start || !daySchedule.end) return { status: "no_schedule" };
  return { status: "working", start: daySchedule.start, end: daySchedule.end };
}
