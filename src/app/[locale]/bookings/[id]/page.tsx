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
  Loader2,
} from "lucide-react";
import { clsx } from "clsx";
import { Link } from "@/i18n/routing";
import { useAuthContext } from "@/features/auth";
import { bookingQueries, salonQueries } from "@/lib/api/queries";
import { bookingMutations } from "@/lib/api/mutations";
import { bookingsApi } from "@/features/bookings/api";
import {
  getDayName,
  formatTime,
  formatDateForDB,
  isDateInHolidays,
  getDesignerWorkHours,
} from "@/features/bookings/utils";
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

// ─── Reschedule Panel ────────────────────────────────────────

function ReschedulePanel({
  booking,
  onClose,
  onSuccess,
}: {
  booking: BookingWithDetails;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const t = useTranslations("booking");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  const [salon, setSalon] = useState<Salon | null>(null);
  const [staff, setStaff] = useState<StaffWithProfile[]>([]);
  const [existingBookings, setExistingBookings] = useState<
    { artist_id: string; start_time: string; end_time: string; duration_minutes: number }[]
  >([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);

  // Confirm modal
  const [confirmData, setConfirmData] = useState<{
    designer: StaffWithProfile;
    time: string;
  } | null>(null);
  const [isRescheduling, setIsRescheduling] = useState(false);

  const dateScrollRef = useRef<HTMLDivElement>(null);

  // 초기 데이터 로드 (살롱 + 스태프)
  useEffect(() => {
    const loadData = async () => {
      try {
        const [salonData, staffData] = await Promise.all([
          salonQueries.getById(booking.salon_id),
          salonQueries.getStaff(booking.salon_id),
        ]);
        setSalon(salonData);
        setStaff(staffData);
      } catch {
        // silently fail
      } finally {
        setIsLoadingData(false);
      }
    };
    loadData();
  }, [booking.salon_id]);

  // 날짜 변경 시 예약 데이터 로드
  useEffect(() => {
    if (!salon) return;
    const loadBookings = async () => {
      setIsLoadingBookings(true);
      try {
        const data = await bookingsApi.getBookingsBySalon(
          booking.salon_id,
          formatDateForDB(selectedDate)
        );
        setExistingBookings(data);
      } catch {
        setExistingBookings([]);
      } finally {
        setIsLoadingBookings(false);
      }
    };
    loadBookings();
  }, [selectedDate, salon, booking.salon_id]);

  // 예약 가능 날짜 목록
  const availableDates = useMemo(() => {
    if (!salon) return [];
    const dates: Date[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const advanceDays = (salon.settings as Record<string, unknown> | null)?.booking_advance_days as number || 30;
    for (let i = 0; i < advanceDays; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    return dates;
  }, [salon]);

  const isDateEnabled = useCallback(
    (date: Date): boolean => {
      if (!salon) return false;
      if (isDateInHolidays(date, salon.holidays as HolidayEntry[] | null)) return false;
      const dayName = getDayName(date);
      const bh = salon.business_hours as BusinessHoursMap;
      const hours = bh?.[dayName];
      return !!(hours?.enabled && hours.open && hours.close);
    },
    [salon]
  );

  const isSalonHoliday = useCallback(
    (date: Date): boolean => {
      if (!salon) return false;
      return isDateInHolidays(date, salon.holidays as HolidayEntry[] | null);
    },
    [salon]
  );

  const isDesignerHoliday = useCallback(
    (designer: StaffWithProfile, date: Date): boolean => {
      if (isDateInHolidays(date, designer.staff_profiles?.holidays || null)) return true;
      const dayName = getDayName(date);
      const workResult = getDesignerWorkHours(designer, dayName);
      return workResult.status === "day_off";
    },
    []
  );

  const getDesignerTimeSlots = useCallback(
    (designer: StaffWithProfile): string[] => {
      if (!salon || isSalonHoliday(selectedDate)) return [];

      const dayName = getDayName(selectedDate);
      const bh = salon.business_hours as BusinessHoursMap;
      const salonHours = bh?.[dayName];
      if (!salonHours?.enabled || !salonHours.open || !salonHours.close) return [];

      if (isDesignerHoliday(designer, selectedDate)) return [];

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
        ((salon.settings as Record<string, unknown> | null)?.slot_duration_minutes as number) || 60;
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
    [salon, selectedDate, isSalonHoliday, isDesignerHoliday]
  );

  const isSlotAvailable = useCallback(
    (designerId: string, time: string): boolean => {
      if (!salon) return false;
      const now = new Date();
      const isToday = selectedDate.toDateString() === now.toDateString();

      const [slotHour, slotMin] = time.split(":").map(Number);
      const slotMinutes = slotHour * 60 + slotMin;

      if (isToday) {
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        if (slotMinutes <= currentMinutes) return false;
      }

      const slotDuration =
        ((salon.settings as Record<string, unknown> | null)?.slot_duration_minutes as number) || 60;
      const slotEnd = slotMinutes + slotDuration;

      for (const b of existingBookings) {
        if (b.artist_id !== designerId) continue;
        // 자기 자신의 예약은 제외 (현재 변경 대상)
        const [bH, bM] = b.start_time.split(":").map(Number);
        const bStart = bH * 60 + bM;
        const bEnd = bStart + b.duration_minutes;

        if (slotMinutes < bEnd && slotEnd > bStart) {
          return false;
        }
      }

      return true;
    },
    [salon, selectedDate, existingBookings]
  );

  const handleSlotClick = useCallback(
    (designer: StaffWithProfile, time: string) => {
      setConfirmData({ designer, time });
    },
    []
  );

  const handleConfirmReschedule = useCallback(async () => {
    if (!confirmData || !salon) return;
    setIsRescheduling(true);

    const slotDuration =
      ((salon.settings as Record<string, unknown> | null)?.slot_duration_minutes as number) || 60;
    const [sH, sM] = confirmData.time.split(":").map(Number);
    const endTime = formatTime(sH * 60 + sM + slotDuration);

    try {
      await bookingMutations.reschedule(booking.id, {
        artist_id: confirmData.designer.id,
        booking_date: formatDateForDB(selectedDate),
        start_time: confirmData.time,
        end_time: endTime,
      });
      setConfirmData(null);
      onSuccess();
    } catch {
      alert(t("rescheduleFailed"));
    } finally {
      setIsRescheduling(false);
    }
  }, [confirmData, salon, booking.id, selectedDate, t, onSuccess]);

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

  if (isLoadingData) {
    return (
      <div className="fixed inset-0 z-50 bg-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!salon) {
    return (
      <div className="fixed inset-0 z-50 bg-white">
        <header className="sticky top-0 bg-white border-b border-gray-100">
          <div className="flex items-center justify-between px-4 h-14">
            <button onClick={onClose} className="touch-target -ml-2 rounded-full p-2">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="font-semibold">{t("rescheduleTitle")}</span>
            <div className="w-9" />
          </div>
        </header>
        <div className="p-4 text-center text-gray-500 mt-12">{t("bookingLoadError")}</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between px-4 h-14">
          <button
            onClick={onClose}
            className="touch-target -ml-2 rounded-full p-2 transition-colors hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-semibold">{t("rescheduleTitle")}</span>
          <div className="w-9" />
        </div>
      </header>

      {/* Description */}
      <p className="px-4 pt-3 pb-2 text-sm text-gray-500">{t("rescheduleSelectDateTime")}</p>

      {/* Horizontal Date Selector */}
      <div className="relative px-4 pb-3">
        <div
          ref={dateScrollRef}
          className="flex gap-2 overflow-x-auto scrollbar-hide py-1"
        >
          {availableDates.map((date) => {
            const enabled = isDateEnabled(date);
            const isSelected = date.toDateString() === selectedDate.toDateString();
            const isToday = date.toDateString() === new Date().toDateString();
            return (
              <button
                key={date.toISOString()}
                onClick={() => enabled && setSelectedDate(date)}
                disabled={!enabled}
                className={clsx(
                  "flex-shrink-0 flex flex-col items-center justify-center rounded-xl px-3 py-2 min-w-[64px] text-xs transition-colors",
                  isSelected
                    ? "bg-primary-500 text-white"
                    : enabled
                    ? "bg-gray-50 text-gray-700 hover:bg-gray-100"
                    : "bg-gray-50 text-gray-300 cursor-not-allowed"
                )}
              >
                <span className="font-medium">
                  {date.getDate()}
                </span>
                <span className={clsx("mt-0.5", isSelected ? "text-white/80" : "text-gray-400")}>
                  {isToday
                    ? tCommon("today")
                    : (() => {
                        const dayName = getDayName(date);
                        return tCommon(`days.${dayName}`);
                      })()}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="h-px bg-gray-100" />

      {/* Designer Time Slots */}
      <div className="px-4 py-4 pb-24">
        {isLoadingBookings ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : staff.length > 0 ? (
          <div className="space-y-3">
            {staff.map((designer) => {
              const slots = getDesignerTimeSlots(designer);
              const holiday = isDesignerHoliday(designer, selectedDate);
              const salonClosed = isSalonHoliday(selectedDate) || !isDateEnabled(selectedDate);

              return (
                <div key={designer.id} className="rounded-xl bg-gray-50 p-3">
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
                        const available = isSlotAvailable(designer.id, time);
                        return (
                          <button
                            key={time}
                            onClick={() => available && handleSlotClick(designer, time)}
                            disabled={!available}
                            className={clsx(
                              "touch-target rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                              available
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
          <div className="text-center py-8 text-gray-400">
            <p>{t("noDesigners")}</p>
          </div>
        )}
      </div>

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
                <span className="font-medium">{formatConfirmDate(selectedDate)}</span>
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
                className="w-full min-h-[44px] rounded-xl bg-primary-500 text-white text-sm font-semibold transition-colors hover:bg-primary-600 disabled:opacity-50"
              >
                {isRescheduling ? t("rescheduling") : t("rescheduleConfirm")}
              </button>
              <button
                onClick={() => setConfirmData(null)}
                disabled={isRescheduling}
                className="w-full min-h-[44px] rounded-xl text-sm font-medium text-gray-500 transition-colors hover:bg-gray-50 disabled:opacity-50"
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

// ─── Main Page ────────────────────────────────────────────────

export default function BookingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const bookingId = params.id as string;
  const t = useTranslations("booking");
  const { isAuthenticated, isLoading: authLoading } = useAuthContext();

  const [booking, setBooking] = useState<BookingWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cancel modal state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

  // Reschedule panel state
  const [showReschedulePanel, setShowReschedulePanel] = useState(false);

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

  const handleRescheduleSuccess = useCallback(async () => {
    setShowReschedulePanel(false);
    setIsLoading(true);
    try {
      const updated = await bookingQueries.getById(bookingId);
      setBooking(updated as BookingWithDetails);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, [bookingId]);

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

  if (authLoading || isLoading) {
    return (
      <div className="app-page-bleed bg-white">
        <div className="h-14 bg-gray-100 animate-pulse" />
        <div className="p-4 space-y-4">
          <div className="h-32 bg-gray-100 rounded-xl animate-pulse" />
          <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />
        </div>
      </div>
    );
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
              className="touch-target flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 py-3 transition-colors hover:bg-gray-50"
            >
              <Phone className="w-5 h-5 text-gray-600" />
              <span className="font-medium text-gray-700">{t("callSalon")}</span>
            </a>
          )}

          {/* Reschedule & Cancel Buttons */}
          {canModify && (
            <div className="space-y-2">
              <button
                onClick={() => setShowReschedulePanel(true)}
                className="touch-target flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 py-3 transition-colors hover:bg-gray-50"
              >
                <RefreshCw className="w-4 h-4 text-gray-600" />
                <span className="font-medium text-gray-700">{t("reschedule")}</span>
              </button>

              <button
                onClick={() => setShowCancelModal(true)}
                className="touch-target w-full rounded-xl py-3 font-medium text-red-500 transition-colors hover:bg-red-50"
              >
                {t("cancelBooking")}
              </button>
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
                className="w-full min-h-[44px] rounded-xl bg-red-500 text-white text-sm font-semibold transition-colors hover:bg-red-600 disabled:opacity-50"
              >
                {isCancelling ? t("cancelling") : t("cancelConfirm")}
              </button>
              <button
                onClick={() => setShowCancelModal(false)}
                disabled={isCancelling}
                className="w-full min-h-[44px] rounded-xl text-sm font-medium text-gray-500 transition-colors hover:bg-gray-50 disabled:opacity-50"
              >
                {t("close")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Panel (Full Screen) */}
      {showReschedulePanel && booking && (
        <ReschedulePanel
          booking={booking}
          onClose={() => setShowReschedulePanel(false)}
          onSuccess={handleRescheduleSuccess}
        />
      )}
    </div>
  );
}
