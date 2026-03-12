"use client";

import { memo, useMemo, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useShallow } from "zustand/react/shallow";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations, useLocale } from "next-intl";
import { ArrowLeft, Home, Check } from "lucide-react";
import { Link } from "@/i18n/routing";
import { useAuthContext, LoginModal } from "@/features/auth";
import type { StaffWithProfile, HolidayEntry } from "@/lib/supabase/types";

type BusinessHoursMap = Record<string, { enabled?: boolean; open?: string; close?: string }> | null;
import { bookingsApi } from "../api";
import { customerMutations } from "@/lib/api";
import { getDayName, formatTime, formatDateForDB, isDateInHolidays, getArtistWorkHours } from "../utils";
import { useBookingFlowStore } from "../stores/useBookingFlowStore";
import { useArtistBookingsQuery } from "../hooks/useDesignerBookingsQuery";
import { ServiceStep } from "./ServiceStep";
import { ArtistStep } from "./DesignerStep";
import { DateTimeStep } from "./DateTimeStep";
import { ConfirmStep } from "./ConfirmStep";
import type { BookingViewProps, BookingStep, TimeSlot } from "../types";

export const BookingView = memo(function BookingView({ salon, staff, services, categories }: BookingViewProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const t = useTranslations("booking");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const { isAuthenticated, user } = useAuthContext();

  // Zustand store
  const {
    currentStep,
    selectedService,
    selectedArtist,
    selectedDate,
    selectedTime,
    customerNotes,
    customerName,
    customerPhone,
    showLoginModal,
    isSubmitting,
    goToNextStep,
    goToPrevStep,
    setSelectedService,
    setSelectedArtist,
    setSelectedDate,
    setSelectedTime,
    setCustomerNotes,
    setCustomerName,
    setCustomerPhone,
    setShowLoginModal,
    setIsSubmitting,
    canProceed,
    getStepCompleted,
    reset,
  } = useBookingFlowStore(
    useShallow((state) => ({
      currentStep: state.currentStep,
      selectedService: state.selectedService,
      selectedArtist: state.selectedArtist,
      selectedDate: state.selectedDate,
      selectedTime: state.selectedTime,
      customerNotes: state.customerNotes,
      customerName: state.customerName,
      customerPhone: state.customerPhone,
      showLoginModal: state.showLoginModal,
      isSubmitting: state.isSubmitting,
      goToNextStep: state.goToNextStep,
      goToPrevStep: state.goToPrevStep,
      setSelectedService: state.setSelectedService,
      setSelectedArtist: state.setSelectedArtist,
      setSelectedDate: state.setSelectedDate,
      setSelectedTime: state.setSelectedTime,
      setCustomerNotes: state.setCustomerNotes,
      setCustomerName: state.setCustomerName,
      setCustomerPhone: state.setCustomerPhone,
      setShowLoginModal: state.setShowLoginModal,
      setIsSubmitting: state.setIsSubmitting,
      canProceed: state.canProceed,
      getStepCompleted: state.getStepCompleted,
      reset: state.reset,
    }))
  );

  // Reset store when component unmounts
  useEffect(() => {
    return () => reset();
  }, [reset]);

  // TanStack Query - 아티스트별 예약 데이터
  const { data: existingBookings = [], isLoading: loadingSlots } = useArtistBookingsQuery(
    selectedArtist?.id ?? null,
    selectedDate
  );

  // Generate available dates
  const availableDates = useMemo(() => {
    const days = (salon.settings as Record<string, unknown> | null)?.booking_advance_days as number || 30;
    const dates: Date[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    return dates;
  }, [salon.settings]);

  // Check if a date is a salon holiday
  const isSalonHoliday = useCallback((date: Date): boolean => {
    return isDateInHolidays(date, salon.holidays as HolidayEntry[] | null);
  }, [salon.holidays]);

  // Check if an artist is on holiday
  const isArtistOnHoliday = useCallback((artist: StaffWithProfile, date: Date): boolean => {
    return isDateInHolidays(date, artist.staff_profiles?.holidays || null);
  }, []);

  // Check if a time slot is available
  const checkSlotAvailable = useCallback((startTime: string, duration: number): boolean => {
    if (!selectedDate) return false;

    const [startHour, startMin] = startTime.split(":").map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = startMinutes + duration;

    const now = new Date();
    if (selectedDate.toDateString() === now.toDateString()) {
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      if (startMinutes <= currentMinutes) return false;
    }

    for (const booking of existingBookings) {
      const [bookingHour, bookingMin] = booking.start_time.split(":").map(Number);
      const bookingStart = bookingHour * 60 + bookingMin;
      const bookingEnd = bookingStart + booking.duration_minutes;

      if (startMinutes < bookingEnd && endMinutes > bookingStart) {
        return false;
      }
    }

    return true;
  }, [selectedDate, existingBookings]);

  // Generate time slots
  const timeSlots = useMemo((): TimeSlot[] => {
    if (!selectedDate || !selectedService) return [];

    if (isSalonHoliday(selectedDate)) return [];

    const dayName = getDayName(selectedDate);
    const bh = salon.business_hours as BusinessHoursMap;
    const hours = bh?.[dayName];

    if (!hours?.enabled || !hours.open || !hours.close) {
      return [];
    }

    if (selectedArtist && isArtistOnHoliday(selectedArtist, selectedDate)) {
      return [];
    }

    const salonOpenMinutes = hours.open.split(":").map(Number).reduce((h, m) => h * 60 + m);
    const salonCloseMinutes = hours.close.split(":").map(Number).reduce((h, m) => h * 60 + m);

    let effectiveOpen = salonOpenMinutes;
    let effectiveClose = salonCloseMinutes;

    if (selectedArtist) {
      const artistHours = getArtistWorkHours(selectedArtist, dayName);
      if (artistHours.status === "day_off") return [];
      if (artistHours.status === "working") {
        const dStart = artistHours.start.split(":").map(Number).reduce((h, m) => h * 60 + m);
        const dEnd = artistHours.end.split(":").map(Number).reduce((h, m) => h * 60 + m);
        effectiveOpen = Math.max(effectiveOpen, dStart);
        effectiveClose = Math.min(effectiveClose, dEnd);
        if (effectiveOpen >= effectiveClose) return [];
      }
    }

    const slots: TimeSlot[] = [];
    const salonSettings = salon.settings as Record<string, unknown> | null;
    const slotDuration = salonSettings?.slot_duration_minutes as number || 30;
    const serviceDuration = selectedService.duration_minutes;

    // 카테고리별 마지막 예약 시간 적용
    const categoryLastBookingTimes = salonSettings?.category_last_booking_times as Record<string, string> | null;
    const categoryId = selectedService.category_id;
    const cutoffStr = categoryId ? categoryLastBookingTimes?.[categoryId] : null;
    let cutoffMinutes: number | null = null;
    if (cutoffStr) {
      const [cutH, cutM] = cutoffStr.split(":").map(Number);
      cutoffMinutes = cutH * 60 + cutM;
    }

    for (let time = effectiveOpen; time + serviceDuration <= effectiveClose; time += slotDuration) {
      if (cutoffMinutes !== null && time >= cutoffMinutes) break;
      const timeStr = formatTime(time);
      const isAvailable = checkSlotAvailable(timeStr, serviceDuration);
      slots.push({ time: timeStr, available: isAvailable });
    }

    return slots;
  }, [selectedDate, selectedService, selectedArtist, salon.business_hours, salon.settings, isSalonHoliday, isArtistOnHoliday, checkSlotAvailable]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle booking submission
  const handleSubmitBooking = useCallback(async () => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    if (!selectedService || !selectedArtist || !selectedDate || !selectedTime || !user || !customerName.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. 고객 찾기 또는 생성
      const customer = await customerMutations.findOrCreate({
        salon_id: salon.id,
        name: customerName,
        phone: customerPhone || undefined,
      });

      // 2. 예약 생성
      const [startHour, startMin] = selectedTime.split(":").map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = startMinutes + selectedService.duration_minutes;
      const endTime = formatTime(endMinutes);

      const booking = await bookingsApi.createBooking({
        salon_id: salon.id,
        customer_id: customer.id,
        artist_id: selectedArtist.id,
        service_id: selectedService.id,
        booking_date: formatDateForDB(selectedDate),
        start_time: selectedTime,
        end_time: endTime,
        duration_minutes: selectedService.duration_minutes,
        status: "PENDING",
        service_price: selectedService.base_price || 0,
        total_price: selectedService.base_price || 0,
        customer_notes: customerNotes || null,
        booking_meta: {
          channel: 'web',
          locale,
        },
      });

      // 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ["artist-bookings"] });

      router.push(`/bookings/${booking.id}?new=1`);
    } catch (error) {
      console.error("Booking error:", error);
      alert(t("bookingFailed"));
    } finally {
      setIsSubmitting(false);
    }
  }, [isAuthenticated, selectedService, selectedArtist, selectedDate, selectedTime, user, salon.id, customerName, customerPhone, customerNotes, queryClient, router, t, locale, setShowLoginModal, setIsSubmitting]);

  const handleNext = useCallback(() => {
    if (currentStep === "confirm") {
      handleSubmitBooking();
    } else {
      goToNextStep();
    }
  }, [currentStep, goToNextStep, handleSubmitBooking]);

  const handleBack = useCallback(() => {
    if (currentStep === "service") {
      router.back();
    } else {
      goToPrevStep();
    }
  }, [currentStep, goToPrevStep, router]);

  return (
    <div className="bg-white min-h-dvh pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between px-4 h-14">
          <button
            onClick={handleBack}
            className="touch-target -ml-2 rounded-full p-2 transition-colors hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-semibold">{t("title")}</h1>
          <Link href="/" className="touch-target -mr-2 rounded-full p-2 transition-colors hover:bg-gray-100" aria-label="Home">
            <Home className="w-5 h-5" />
          </Link>
        </div>

        {/* Progress Steps */}
        <div className="flex px-4 pb-3">
          {(["service", "artist", "datetime", "confirm"] as BookingStep[]).map((step, index) => (
            <div key={step} className="flex-1 flex items-center">
              <div
                className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  currentStep === step
                    ? "bg-primary-600 text-white"
                    : getStepCompleted(step)
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {getStepCompleted(step) ? <Check className="w-4 h-4" /> : index + 1}
              </div>
              {index < 3 && (
                <div
                  className={`flex-1 h-0.5 mx-1 ${
                    getStepCompleted(step) ? "bg-green-500" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </header>

      {/* Content */}
      <div className="p-4">
        {currentStep === "service" && (
          <ServiceStep
            services={services}
            categories={categories}
            selectedService={selectedService}
            onSelect={setSelectedService}
            t={t}
          />
        )}

        {currentStep === "artist" && (
          <ArtistStep
            staff={staff}
            selectedArtist={selectedArtist}
            onSelect={setSelectedArtist}
            t={t}
          />
        )}

        {currentStep === "datetime" && (
          <DateTimeStep
            availableDates={availableDates}
            timeSlots={timeSlots}
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            onSelectDate={setSelectedDate}
            onSelectTime={setSelectedTime}
            loadingSlots={loadingSlots}
            salon={salon}
            selectedArtist={selectedArtist}
            t={t}
          />
        )}

        {currentStep === "confirm" && selectedService && selectedArtist && selectedDate && selectedTime && (
          <ConfirmStep
            salon={salon}
            service={selectedService}
            artist={selectedArtist}
            date={selectedDate}
            time={selectedTime}
            notes={customerNotes}
            onNotesChange={setCustomerNotes}
            customerName={customerName}
            onCustomerNameChange={setCustomerName}
            customerPhone={customerPhone}
            onCustomerPhoneChange={setCustomerPhone}
            t={t}
          />
        )}
      </div>

      {/* Bottom Button */}
      <div className="fixed bottom-0 left-1/2 z-50 w-full max-w-[var(--app-max-width)] -translate-x-1/2 border-t border-gray-100 bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <button
          onClick={handleNext}
          disabled={!canProceed() || isSubmitting}
          className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl transition-colors"
        >
          {isSubmitting
            ? t("processing")
            : currentStep === "confirm"
            ? t("confirmBooking")
            : tCommon("next")}
        </button>
      </div>

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={() => {
          setShowLoginModal(false);
          handleSubmitBooking();
        }}
      />
    </div>
  );
});
