"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Home,
  Check,
  Calendar,
  MapPin,
  User,
  Scissors,
  Phone,
  X,
  RefreshCw,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { clsx } from "clsx";
import { Link } from "@/i18n/routing";
import { useAuthContext } from "@/features/auth";
import { bookingQueries, salonQueries } from "@/lib/api/queries";
import { bookingMutations } from "@/lib/api/mutations";
import { bookingsApi } from "@/features/bookings/api";
import { getLocaleCode } from "@/features/salons/utils";
import {
  getDayName,
  formatTime,
  formatDateForDB,
  isDateInHolidays,
  getDesignerWorkHours,
} from "@/features/bookings/utils";
import { BookingDetailSkeleton, RescheduleDataSkeleton } from "@/components/ui/Skeleton";
import type { Booking, Salon, Service, StaffWithProfile, HolidayEntry } from "@/lib/supabase/types";

type BusinessHoursMap = Record<string, { enabled?: boolean; open?: string; close?: string }> | null;

type ContactChannels = {
  line?: { enabled: boolean; id: string };
  instagram?: { enabled: boolean; id: string };
};

type SalonSettings = {
  contact_channels?: ContactChannels;
  [key: string]: unknown;
};

type BookingWithDetails = Booking & {
  salons: Salon & { settings: SalonSettings | null };
  services: Service;
  designer: {
    id: string;
    name: string;
    profile_image: string | null;
  };
  lineVerified: boolean;
};

type RescheduleSlot = {
  artist_id: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
};

// ─── Main Page ────────────────────────────────────────────────

export default function BookingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const bookingId = params.id as string;
  const t = useTranslations("booking");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const { isAuthenticated, isLoading: authLoading } = useAuthContext();

  const [booking, setBooking] = useState<BookingWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cancel modal state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

  // Reschedule accordion state
  const [showReschedule, setShowReschedule] = useState(false);
  const [reschedSalon, setReschedSalon] = useState<Salon | null>(null);
  const [reschedStaff, setReschedStaff] = useState<StaffWithProfile[]>([]);
  const [reschedBookings, setReschedBookings] = useState<RescheduleSlot[]>([]);
  const [reschedDate, setReschedDate] = useState(new Date());
  const [reschedLoadingData, setReschedLoadingData] = useState(false);
  const [reschedLoadingSlots, setReschedLoadingSlots] = useState(false);
  const [showReschedCalendar, setShowReschedCalendar] = useState(false);
  const [reschedCalendarMonth, setReschedCalendarMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [confirmData, setConfirmData] = useState<{
    designer: StaffWithProfile;
    time: string;
  } | null>(null);
  const [isRescheduling, setIsRescheduling] = useState(false);

  const reschedCalendarRef = useRef<HTMLDivElement>(null);
  const reschedSlotRequestIdRef = useRef(0);
  const reschedSlotsCacheRef = useRef<Record<string, RescheduleSlot[]>>({});
  const reschedSlotsInFlightRef = useRef<Record<string, Promise<RescheduleSlot[]>>>({});
  const reschedWeekPrefetchDoneRef = useRef(false);
  const localeCode = getLocaleCode(locale);

  // ─── Fetch Booking ─────────────────────────────────────────

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    fetchBooking();
  }, [authLoading, isAuthenticated, bookingId]);

  const fetchBooking = async () => {
    try {
      const data = await bookingQueries.getById(bookingId);
      setBooking(data as BookingWithDetails);
    } catch {
      setError(t("bookingLoadError"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    reschedSlotsCacheRef.current = {};
    reschedSlotsInFlightRef.current = {};
    reschedWeekPrefetchDoneRef.current = false;
  }, [bookingId]);

  const getOrFetchReschedSlots = useCallback(
    async (dateKey: string): Promise<RescheduleSlot[]> => {
      const cached = reschedSlotsCacheRef.current[dateKey];
      if (cached) return cached;

      const inFlight = reschedSlotsInFlightRef.current[dateKey];
      if (inFlight) return inFlight;

      if (!booking) return [];

      const request = bookingsApi
        .getBookingsBySalon(booking.salon_id, dateKey)
        .then((data) => {
          reschedSlotsCacheRef.current[dateKey] = data;
          return data;
        })
        .finally(() => {
          delete reschedSlotsInFlightRef.current[dateKey];
        });

      reschedSlotsInFlightRef.current[dateKey] = request;
      return request;
    },
    [booking]
  );

  // ─── Reschedule: load salon + staff when accordion opens ───

  useEffect(() => {
    if (!showReschedule || !booking || reschedSalon) return;
    const loadData = async () => {
      setReschedLoadingData(true);
      try {
        const [salonData, staffData] = await Promise.all([
          salonQueries.getById(booking.salon_id),
          salonQueries.getStaff(booking.salon_id),
        ]);
        setReschedSalon(salonData);
        setReschedStaff(staffData);
      } catch {
        // silently fail
      } finally {
        setReschedLoadingData(false);
      }
    };
    loadData();
  }, [showReschedule, booking, reschedSalon]);

  // ─── Reschedule: load bookings when date changes ───────────

  useEffect(() => {
    if (!showReschedule || !reschedSalon || !booking) return;
    const loadBookings = async () => {
      const requestId = ++reschedSlotRequestIdRef.current;
      const dateKey = formatDateForDB(reschedDate);
      const hasCached = !!reschedSlotsCacheRef.current[dateKey];
      if (hasCached) {
        setReschedBookings(reschedSlotsCacheRef.current[dateKey]);
        setReschedLoadingSlots(false);
        return;
      }

      setReschedLoadingSlots(true);
      try {
        const data = await getOrFetchReschedSlots(dateKey);
        if (requestId !== reschedSlotRequestIdRef.current) return;
        setReschedBookings(data);
      } catch {
        if (requestId !== reschedSlotRequestIdRef.current) return;
        setReschedBookings([]);
      } finally {
        if (requestId !== reschedSlotRequestIdRef.current) return;
        setReschedLoadingSlots(false);
      }
    };
    loadBookings();
  }, [reschedDate, reschedSalon, showReschedule, booking, getOrFetchReschedSlots]);

  useEffect(() => {
    if (!showReschedule) {
      setShowReschedCalendar(false);
    }
  }, [showReschedule]);

  useEffect(() => {
    if (!showReschedCalendar) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (reschedCalendarRef.current && !reschedCalendarRef.current.contains(e.target as Node)) {
        setShowReschedCalendar(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showReschedCalendar]);

  // ─── Reschedule: computed values ───────────────────────────

  const reschedAvailDates = useMemo(() => {
    if (!reschedSalon) return [];
    const dates: Date[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const advanceDays = (reschedSalon.settings as Record<string, unknown> | null)?.booking_advance_days as number || 30;
    for (let i = 0; i < advanceDays; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    return dates;
  }, [reschedSalon]);

  const isReschedDateEnabled = useCallback(
    (date: Date): boolean => {
      if (!reschedSalon) return false;
      if (isDateInHolidays(date, reschedSalon.holidays as HolidayEntry[] | null)) return false;
      const dayName = getDayName(date);
      const bh = reschedSalon.business_hours as BusinessHoursMap;
      const hours = bh?.[dayName];
      return !!(hours?.enabled && hours.open && hours.close);
    },
    [reschedSalon]
  );

  useEffect(() => {
    if (!showReschedule || !reschedSalon || !booking || reschedWeekPrefetchDoneRef.current) return;
    const prefetchDateKeys = reschedAvailDates
      .slice(0, 7)
      .filter((date) => isReschedDateEnabled(date))
      .map((date) => formatDateForDB(date));

    if (prefetchDateKeys.length === 0) return;

    reschedWeekPrefetchDoneRef.current = true;
    void Promise.all(
      prefetchDateKeys.map((dateKey) =>
        getOrFetchReschedSlots(dateKey).catch(() => [])
      )
    );
  }, [showReschedule, reschedSalon, booking, reschedAvailDates, isReschedDateEnabled, getOrFetchReschedSlots]);

  const reschedCalendarDays = useMemo(() => {
    const year = reschedCalendarMonth.getFullYear();
    const month = reschedCalendarMonth.getMonth();
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
  }, [reschedCalendarMonth]);

  const isReschedCalendarDateAvailable = useCallback(
    (date: Date): boolean => {
      if (!reschedSalon) return false;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date < today) return false;

      const maxDate = reschedAvailDates[reschedAvailDates.length - 1];
      if (maxDate && date > maxDate) return false;

      return isReschedDateEnabled(date);
    },
    [reschedSalon, reschedAvailDates, isReschedDateEnabled]
  );

  const isReschedSalonHoliday = useCallback(
    (date: Date): boolean => {
      if (!reschedSalon) return false;
      return isDateInHolidays(date, reschedSalon.holidays as HolidayEntry[] | null);
    },
    [reschedSalon]
  );

  const isReschedDesignerHoliday = useCallback(
    (designer: StaffWithProfile, date: Date): boolean => {
      if (isDateInHolidays(date, designer.staff_profiles?.holidays || null)) return true;
      const dayName = getDayName(date);
      const workResult = getDesignerWorkHours(designer, dayName);
      return workResult.status === "day_off";
    },
    []
  );

  const getReschedDesignerSlots = useCallback(
    (designer: StaffWithProfile): string[] => {
      if (!reschedSalon || isReschedSalonHoliday(reschedDate)) return [];

      const dayName = getDayName(reschedDate);
      const bh = reschedSalon.business_hours as BusinessHoursMap;
      const salonHours = bh?.[dayName];
      if (!salonHours?.enabled || !salonHours.open || !salonHours.close) return [];

      if (isReschedDesignerHoliday(designer, reschedDate)) return [];

      const designerHours = getDesignerWorkHours(designer, dayName);
      let effectiveStart: string;
      let effectiveEnd: string;

      if (designerHours.status === "day_off") return [];

      if (designerHours.status === "working") {
        const [sOH, sOM] = salonHours.open.split(":").map(Number);
        const [sCH, sCM] = salonHours.close.split(":").map(Number);
        const [dSH, dSM] = designerHours.start.split(":").map(Number);
        const [dEH, dEM] = designerHours.end.split(":").map(Number);

        const startMin = Math.max(sOH * 60 + sOM, dSH * 60 + dSM);
        const endMin = Math.min(sCH * 60 + sCM, dEH * 60 + dEM);
        if (startMin >= endMin) return [];

        effectiveStart = formatTime(startMin);
        effectiveEnd = formatTime(endMin);
      } else {
        effectiveStart = salonHours.open;
        effectiveEnd = salonHours.close;
      }

      const slotDuration =
        ((reschedSalon.settings as Record<string, unknown> | null)?.slot_duration_minutes as number) || 60;
      const [sH, sM] = effectiveStart.split(":").map(Number);
      const [eH, eM] = effectiveEnd.split(":").map(Number);
      const startMinutes = sH * 60 + sM;
      const endMinutes = eH * 60 + eM;

      const slots: string[] = [];
      for (let time = startMinutes; time < endMinutes; time += slotDuration) {
        slots.push(formatTime(time));
      }
      return slots;
    },
    [reschedSalon, reschedDate, isReschedSalonHoliday, isReschedDesignerHoliday]
  );

  const isReschedSlotAvailable = useCallback(
    (designerId: string, time: string): boolean => {
      if (!reschedSalon) return false;
      const now = new Date();
      const isToday = reschedDate.toDateString() === now.toDateString();

      const [slotHour, slotMin] = time.split(":").map(Number);
      const slotMinutes = slotHour * 60 + slotMin;

      if (isToday) {
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        if (slotMinutes <= currentMinutes) return false;
      }

      const slotDuration =
        ((reschedSalon.settings as Record<string, unknown> | null)?.slot_duration_minutes as number) || 60;
      const slotEnd = slotMinutes + slotDuration;

      for (const b of reschedBookings) {
        if (b.artist_id !== designerId) continue;
        const [bH, bM] = b.start_time.split(":").map(Number);
        const bStart = bH * 60 + bM;
        const bEnd = bStart + b.duration_minutes;

        if (slotMinutes < bEnd && slotEnd > bStart) {
          return false;
        }
      }

      return true;
    },
    [reschedSalon, reschedDate, reschedBookings]
  );

  // ─── Reschedule: actions ───────────────────────────────────

  const handleToggleReschedule = useCallback(() => {
    setShowReschedule((prev) => {
      const next = !prev;
      if (next) {
        setReschedCalendarMonth(new Date(reschedDate.getFullYear(), reschedDate.getMonth(), 1));
      } else {
        setShowReschedCalendar(false);
      }
      return next;
    });
  }, [reschedDate]);

  const handleSlotClick = useCallback(
    (designer: StaffWithProfile, time: string) => {
      setConfirmData({ designer, time });
    },
    []
  );

  const handleConfirmReschedule = useCallback(async () => {
    if (!confirmData || !reschedSalon) return;
    setIsRescheduling(true);

    const slotDuration =
      ((reschedSalon.settings as Record<string, unknown> | null)?.slot_duration_minutes as number) || 60;
    const [sH, sM] = confirmData.time.split(":").map(Number);
    const endTime = formatTime(sH * 60 + sM + slotDuration);

    try {
      await bookingMutations.reschedule(booking!.id, {
        artist_id: confirmData.designer.id,
        booking_date: formatDateForDB(reschedDate),
        start_time: confirmData.time,
        end_time: endTime,
      });
      setConfirmData(null);
      setShowReschedule(false);
      reschedSlotsCacheRef.current = {};
      reschedSlotsInFlightRef.current = {};
      setIsLoading(true);
      try {
        const updated = await bookingQueries.getById(bookingId);
        setBooking(updated as BookingWithDetails);
      } catch { /* ignore */ }
      setIsLoading(false);
    } catch {
      alert(t("rescheduleFailed"));
    } finally {
      setIsRescheduling(false);
    }
  }, [confirmData, reschedSalon, booking, reschedDate, bookingId, t]);

  const formatConfirmDate = useCallback(
    (date: Date) => {
      if (locale === "ko") {
        const days = ["일", "월", "화", "수", "목", "금", "토"];
        return `${date.getMonth() + 1}월 ${date.getDate()}일 (${days[date.getDay()]})`;
      }
      if (locale === "th") {
        return date.toLocaleDateString("th-TH", { month: "short", day: "numeric", weekday: "short" });
      }
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric", weekday: "short" });
    },
    [locale]
  );

  // ─── Cancel ────────────────────────────────────────────────

  const handleCancelBooking = useCallback(async () => {
    if (!booking) return;
    setIsCancelling(true);
    try {
      await bookingMutations.cancel(booking.id, {
        cancelled_by: "customer",
        cancellation_reason: cancelReason || undefined,
      });
      setShowCancelModal(false);
      setCancelReason("");
      const updated = await bookingQueries.getById(bookingId);
      setBooking(updated as BookingWithDetails);
    } catch {
      alert(t("cancelFailed"));
    } finally {
      setIsCancelling(false);
    }
  }, [booking, bookingId, cancelReason, t]);

  // ─── Helpers ───────────────────────────────────────────────

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const days = ["일", "월", "화", "수", "목", "금", "토"];
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 (${days[date.getDay()]})`;
  };

  const getStatusColor = (status: Booking["status"]) => {
    switch (status) {
      case "CONFIRMED":
        return "bg-green-100 text-green-700";
      case "PENDING":
        return "bg-yellow-100 text-yellow-700";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-700";
      case "COMPLETED":
        return "bg-gray-100 text-gray-700";
      case "CANCELLED":
      case "NO_SHOW":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusText = (status: Booking["status"]) => {
    switch (status) {
      case "CONFIRMED":
        return t("statusConfirmed");
      case "PENDING":
        return t("statusPending");
      case "IN_PROGRESS":
        return t("statusInProgress");
      case "COMPLETED":
        return t("statusCompleted");
      case "CANCELLED":
        return t("statusCancelled");
      case "NO_SHOW":
        return t("statusNoShow");
      default:
        return status;
    }
  };

  const cancellationStatus = (() => {
    if (!booking) return { canCancel: false, reason: null as string | null };

    const statusModifiable = booking.status === "PENDING" || booking.status === "CONFIRMED";
    if (!statusModifiable) return { canCancel: false, reason: null };

    const settings = booking.salons.settings as SalonSettings | null;
    const cancellationHours = (settings as Record<string, unknown> | null)?.booking_cancellation_hours as number | undefined ?? 24;

    if (cancellationHours === 0) {
      return { canCancel: false, reason: "noCancellation" as const };
    }

    const [hours, minutes] = booking.start_time.split(":").map(Number);
    const bookingDateTime = new Date(booking.booking_date);
    bookingDateTime.setHours(hours, minutes, 0, 0);
    const deadline = new Date(bookingDateTime.getTime() - cancellationHours * 60 * 60 * 1000);
    const now = new Date();

    if (now >= deadline) {
      return { canCancel: false, reason: "deadlinePassed" as const, hours: cancellationHours };
    }

    return { canCancel: true, reason: null };
  })();

  const canModify = cancellationStatus.canCancel;

  // ─── Loading / Error states ────────────────────────────────

  if (authLoading || isLoading) {
    return <BookingDetailSkeleton />;
  }

  if (error || !booking) {
    return (
      <div className="app-page-bleed bg-white">
        <header className="sticky top-0 bg-white border-b border-gray-100">
          <div className="flex items-center justify-between px-4 h-14">
            <button onClick={() => router.back()} className="touch-target -ml-2 rounded-full p-2">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="font-semibold">{t("bookingDetail")}</span>
            <div className="w-9" />
          </div>
        </header>
        <div className="p-4 text-center text-gray-500 mt-12">
          {error || t("bookingNotFound")}
        </div>
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────────────

  return (
    <div className="app-page-bleed bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between px-4 h-14">
          <button
            onClick={() => router.back()}
            className="touch-target -ml-2 rounded-full p-2 transition-colors hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-semibold">{t("bookingDetail")}</span>
          <Link href="/" className="touch-target -mr-2 rounded-full p-2 transition-colors hover:bg-gray-100" aria-label="Home">
            <Home className="w-5 h-5" />
          </Link>
        </div>
      </header>

      <div className="p-4 space-y-4">
          {/* Success Banner (for new bookings) */}
          {booking.status === "PENDING" && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <Check className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-medium text-green-800">{t("bookingConfirmed")}</p>
                <p className="text-sm text-green-600">{t("bookingReceived")}</p>
              </div>
            </div>
          )}

          {/* LINE Friend Add Banner */}
          {(() => {
            if (!booking.lineVerified) return null;
            const settings = booking.salons.settings as SalonSettings | null;
            const lineChannel = settings?.contact_channels?.line;
            if (!lineChannel?.enabled || !lineChannel?.id) return null;
            const lineUrl = lineChannel.id.startsWith("http")
              ? lineChannel.id
              : `https://line.me/R/ti/p/${lineChannel.id}`;
            return (
              <a
                href={lineUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl bg-[#06C755] p-4 text-white transition-opacity hover:opacity-90"
              >
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{t("lineAddFriend")}</p>
                  <p className="text-xs text-white/80 mt-0.5">{t("lineAddFriendDesc")}</p>
                </div>
                <span className="shrink-0 bg-white text-[#06C755] text-xs font-bold px-3 py-1.5 rounded-full">
                  {t("lineAddFriendButton")}
                </span>
              </a>
            );
          })()}

          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">{t("bookingStatus")}</span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
              {getStatusText(booking.status)}
            </span>
          </div>

          {/* Booking Details Card */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-4">
            {/* Salon */}
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-primary-500 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">{t("salon")}</p>
                <p className="font-medium">{booking.salons.name}</p>
                <p className="text-sm text-gray-500">{booking.salons.address}</p>
              </div>
            </div>

            {/* Service / Category */}
            <div className="flex items-start gap-3">
              <Scissors className="w-5 h-5 text-primary-500 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">{t("service")}</p>
                <p className="font-medium">
                  {(() => {
                    const meta = booking.booking_meta as Record<string, unknown> | null;
                    return (meta?.category_name as string) || booking.services.name;
                  })()}
                </p>
                <p className="text-sm text-gray-500">{booking.duration_minutes}{t("minutes")}</p>
              </div>
            </div>

            {/* Designer */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                {booking.designer.profile_image ? (
                  <img
                    src={booking.designer.profile_image}
                    alt={booking.designer.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-5 h-5 text-gray-400" />
                )}
              </div>
              <div>
                <p className="text-sm text-gray-500">{t("designer")}</p>
                <p className="font-medium">{booking.designer.name}</p>
              </div>
            </div>

            {/* Date & Time */}
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-primary-500 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">{t("dateTime")}</p>
                <p className="font-medium">{formatDate(booking.booking_date)}</p>
                <p className="text-sm text-gray-600">
                  {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}
                </p>
              </div>
            </div>

            {/* Customer Notes */}
            {booking.customer_notes && (
              <div className="pt-3 border-t border-gray-200">
                <p className="mb-1 text-sm text-gray-500">{t("customerNotes")}</p>
                <p className="text-sm text-gray-700">{booking.customer_notes}</p>
              </div>
            )}

            {/* Price */}
            <div className="pt-3 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">{t("totalPrice")}</span>
                <span className="text-xl font-bold text-primary-600">
                  ฿{booking.total_price.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Contact Salon */}
          {booking.salons.phone && (
            <a
              href={`tel:${booking.salons.phone}`}
              className="touch-target ds-control flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 px-3 transition-colors hover:bg-gray-50"
            >
              <Phone className="w-5 h-5 text-gray-600" />
              <span className="font-medium text-gray-700">{t("callSalon")}</span>
            </a>
          )}

          {/* Reschedule & Cancel Buttons */}
          {canModify && (
            <div className="space-y-2">
              {/* Reschedule Accordion Toggle */}
              <button
                onClick={handleToggleReschedule}
                className={clsx(
                  "touch-target ds-control flex w-full items-center justify-center gap-2 rounded-xl border px-3 transition-colors",
                  showReschedule
                    ? "border-primary-300 bg-primary-50 text-primary-700"
                    : "border-gray-200 text-gray-700 hover:bg-gray-50"
                )}
              >
                <RefreshCw className="w-4 h-4" />
                <span className="font-medium">{t("reschedule")}</span>
                <ChevronDown className={clsx("w-4 h-4 transition-transform", showReschedule && "rotate-180")} />
              </button>

              {/* Cancel */}
              <button
                onClick={() => setShowCancelModal(true)}
                className="touch-target ds-control w-full rounded-xl px-3 font-medium text-red-500 transition-colors hover:bg-red-50"
              >
                {t("cancelBooking")}
              </button>
            </div>
          )}

          {/* ─── Reschedule Accordion Content ─── */}
          {showReschedule && canModify && (
            <div className="rounded-xl border border-primary-200 bg-white">
              {/* Accordion Header */}
              <div className="bg-primary-50 px-4 py-3 border-b border-primary-100">
                <p className="text-sm font-medium text-primary-700">{t("rescheduleSelectDateTime")}</p>
              </div>

              {reschedLoadingData ? (
                <RescheduleDataSkeleton />
              ) : !reschedSalon ? (
                <div className="p-4 text-center text-sm text-gray-400">{t("bookingLoadError")}</div>
              ) : (
                <div className="p-4 space-y-4">
                  {/* Weekly Quick Selector */}
                  <div className="rounded-xl bg-gray-50 p-2.5">
                    <div className="grid grid-cols-7 gap-1">
                      {reschedAvailDates.slice(0, 7).map((date) => {
                        const isSelected = date.toDateString() === reschedDate.toDateString();
                        const enabled = isReschedDateEnabled(date);
                        const isToday = date.toDateString() === new Date().toDateString();

                        return (
                          <button
                            key={date.toISOString()}
                            onClick={() => {
                              if (!enabled) return;
                              setReschedDate((prev) =>
                                prev.toDateString() === date.toDateString() ? prev : date
                              );
                              setReschedCalendarMonth(new Date(date.getFullYear(), date.getMonth(), 1));
                            }}
                            disabled={!enabled}
                            className={`rounded-xl border-2 border-transparent py-1.5 text-center transition-colors ${
                              isSelected
                                ? "border-primary-400 bg-primary-100"
                                : enabled
                                ? "hover:bg-gray-100"
                                : "opacity-50 cursor-not-allowed"
                            }`}
                          >
                            <div className={`text-[11px] font-medium ${
                              isSelected ? "text-primary-700" : isToday ? "text-primary-600" : "text-gray-600"
                            }`}>
                              {tCommon(`days.${getDayName(date)}`)}
                            </div>
                            <div className={`mt-0.5 text-sm font-bold ${
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
                  <div ref={reschedCalendarRef} className="relative">
                    <button
                      onClick={() => setShowReschedCalendar(!showReschedCalendar)}
                      className="flex w-full items-center justify-between rounded-xl bg-gray-50 px-3 py-2.5 transition-colors hover:bg-gray-100"
                    >
                      <div className="flex items-center gap-2.5">
                        <Calendar className="h-4 w-4 text-primary-500" />
                        <span className="ds-text-body font-medium text-gray-900">
                          {reschedDate.toLocaleDateString(localeCode, {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            weekday: "long",
                          })}
                        </span>
                      </div>
                      <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${showReschedCalendar ? "rotate-180" : ""}`} />
                    </button>

                    {showReschedCalendar && (
                      <div className="absolute left-0 right-0 z-30 mt-2 rounded-xl border border-gray-200 bg-white p-3 shadow-lg">
                        <div className="mb-3 flex items-center justify-between">
                          <button
                            onClick={() => setReschedCalendarMonth(new Date(reschedCalendarMonth.getFullYear(), reschedCalendarMonth.getMonth() - 1, 1))}
                            className="touch-target rounded-lg p-1.5 transition-colors hover:bg-gray-100"
                          >
                            <ChevronLeft className="h-4 w-4 text-gray-600" />
                          </button>
                          <span className="text-sm font-semibold text-gray-900">
                            {reschedCalendarMonth.toLocaleDateString(localeCode, { year: "numeric", month: "long" })}
                          </span>
                          <button
                            onClick={() => setReschedCalendarMonth(new Date(reschedCalendarMonth.getFullYear(), reschedCalendarMonth.getMonth() + 1, 1))}
                            className="touch-target rounded-lg p-1.5 transition-colors hover:bg-gray-100"
                          >
                            <ChevronRight className="h-4 w-4 text-gray-600" />
                          </button>
                        </div>

                        <div className="mb-1 grid grid-cols-7 gap-1">
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
                          {reschedCalendarDays.map((date, index) => {
                            if (!date) {
                              return <div key={`empty-${index}`} className="h-11" />;
                            }

                            const available = isReschedCalendarDateAvailable(date);
                            const isSelected = reschedDate.toDateString() === date.toDateString();
                            const isToday = date.toDateString() === new Date().toDateString();

                            return (
                              <button
                                key={date.toISOString()}
                                onClick={() => {
                                  if (available) {
                                    setReschedDate((prev) =>
                                      prev.toDateString() === date.toDateString() ? prev : date
                                    );
                                    setShowReschedCalendar(false);
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

                  <div className="h-px bg-gray-100" />

                  {/* Designer Time Slots */}
                  {reschedStaff.length > 0 ? (
                    <div className="space-y-3">
                      {reschedLoadingSlots && (
                        <div className="rounded-xl border border-primary-100 bg-primary-50 px-3 py-2 text-xs font-medium text-primary-700">
                          {tCommon("loading")}
                        </div>
                      )}
                      {reschedStaff.map((designer) => {
                        const slots = getReschedDesignerSlots(designer);
                        const holiday = isReschedDesignerHoliday(designer, reschedDate);
                        const salonClosed = isReschedSalonHoliday(reschedDate) || !isReschedDateEnabled(reschedDate);

                        return (
                          <div key={designer.id} className={clsx("rounded-xl bg-gray-50 p-3", reschedLoadingSlots && "opacity-75")}>
                            {/* Designer Info */}
                            <div className="mb-3 flex items-center gap-3">
                              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200">
                                {designer.profile_image ? (
                                  <img
                                    src={designer.profile_image}
                                    alt={designer.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span className="text-sm font-bold text-gray-400">
                                    {designer.name.charAt(0)}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm font-medium text-gray-900">{designer.name}</p>
                            </div>

                            {/* Time Slots */}
                            <div className="flex flex-wrap gap-2">
                              {salonClosed || holiday ? (
                                <p className="text-sm text-gray-400">{tCommon("closedToday")}</p>
                              ) : slots.length > 0 ? (
                                slots.map((time) => {
                                  const available = isReschedSlotAvailable(designer.id, time);
                                  const canSelect = available && !reschedLoadingSlots;
                                  return (
                                    <button
                                      key={time}
                                      onClick={() => canSelect && handleSlotClick(designer, time)}
                                      disabled={!canSelect}
                                      className={clsx(
                                        "touch-target rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                                        canSelect
                                          ? "bg-white border border-primary-200 text-primary-600 hover:bg-primary-50 hover:border-primary-400"
                                          : "bg-gray-100 text-gray-400 cursor-not-allowed line-through"
                                      )}
                                    >
                                      {time}
                                    </button>
                                  );
                                })
                              ) : (
                                <p className="text-sm text-gray-400">{tCommon("closedToday")}</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-400">
                      <p className="text-sm">{t("noDesigners")}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 취소 불가 안내 */}
          {!canModify && (booking?.status === "PENDING" || booking?.status === "CONFIRMED") && cancellationStatus.reason && (
            <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 text-center">
              <p className="text-sm text-gray-500">
                {cancellationStatus.reason === "noCancellation"
                  ? t("cannotCancelPolicy")
                  : t("cannotCancelDeadline", { hours: (cancellationStatus as { hours?: number }).hours ?? 24 })}
              </p>
              <p className="text-xs text-gray-400 mt-1">{t("rescheduleMessage")}</p>
            </div>
          )}
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50 animate-backdrop" onClick={() => !isCancelling && setShowCancelModal(false)} />

          <div className="relative w-full max-w-[360px] rounded-2xl bg-white p-6 shadow-xl animate-slide-up">
            <button
              onClick={() => !isCancelling && setShowCancelModal(false)}
              className="touch-target absolute right-3 top-3 rounded-full p-1.5 hover:bg-gray-100"
              disabled={isCancelling}
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>

            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {t("cancelConfirmTitle")}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {t("cancelConfirmMessage")}
            </p>

            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder={t("cancelReasonPlaceholder")}
              className="w-full rounded-xl border border-gray-200 p-3 text-sm placeholder:text-gray-400 focus:border-gray-300 focus:outline-none resize-none"
              rows={3}
              disabled={isCancelling}
            />

            <div className="mt-4 space-y-2">
              <button
                onClick={handleCancelBooking}
                disabled={isCancelling}
                className="ds-control w-full rounded-xl bg-red-500 text-white font-semibold transition-colors hover:bg-red-600 disabled:opacity-50"
              >
                {isCancelling ? t("cancelling") : t("cancelConfirm")}
              </button>
              <button
                onClick={() => setShowCancelModal(false)}
                disabled={isCancelling}
                className="ds-control w-full rounded-xl font-medium text-gray-500 transition-colors hover:bg-gray-50 disabled:opacity-50"
              >
                {t("close")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Confirm Modal */}
      {confirmData && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/50 animate-backdrop"
            onClick={() => !isRescheduling && setConfirmData(null)}
          />
          <div className="relative w-full max-w-[360px] rounded-2xl bg-white p-6 shadow-xl animate-slide-up">
            <button
              onClick={() => !isRescheduling && setConfirmData(null)}
              className="touch-target absolute right-3 top-3 rounded-full p-1.5 hover:bg-gray-100"
              disabled={isRescheduling}
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>

            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {t("rescheduleConfirmTitle")}
            </h3>

            <div className="rounded-xl bg-gray-50 p-4 mb-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="font-medium">{formatConfirmDate(reschedDate)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <RefreshCw className="w-4 h-4 text-gray-400" />
                <span className="font-medium">{confirmData.time}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-gray-400" />
                <span className="font-medium">{confirmData.designer.name}</span>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={handleConfirmReschedule}
                disabled={isRescheduling}
                className="ds-control w-full rounded-xl bg-primary-500 text-white font-semibold transition-colors hover:bg-primary-600 disabled:opacity-50"
              >
                {isRescheduling ? t("rescheduling") : t("rescheduleConfirm")}
              </button>
              <button
                onClick={() => setConfirmData(null)}
                disabled={isRescheduling}
                className="ds-control w-full rounded-xl font-medium text-gray-500 transition-colors hover:bg-gray-50 disabled:opacity-50"
              >
                {t("close")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
