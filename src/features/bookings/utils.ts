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
    if (typeof holiday === "object" && holiday !== null && "date" in holiday) {
      return (holiday as { date: string }).date === dateStr;
    }
    return false;
  });
}

export function getDesignerWorkHours(
  designer: StaffWithProfile,
  dayName: string
): { start: string; end: string } | null {
  const workSchedule = designer.staff_profiles?.work_schedule as WorkSchedule | null;
  if (!workSchedule) return null;
  const daySchedule = workSchedule[dayName];
  if (!daySchedule?.enabled || !daySchedule.start || !daySchedule.end) return null;
  return { start: daySchedule.start, end: daySchedule.end };
}
