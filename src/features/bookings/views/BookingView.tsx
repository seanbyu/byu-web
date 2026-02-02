"use client";

import { memo, useMemo, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useShallow } from "zustand/react/shallow";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { ArrowLeft, Home, Check } from "lucide-react";
import { Link } from "@/i18n/routing";
import { useAuthContext, LoginModal } from "@/features/auth";
import type { Salon, StaffWithProfile, Service, ServiceCategory } from "@/lib/supabase/types";
import { bookingsApi } from "../api";
import { getDayName, formatTime, formatDateForDB, isDateInHolidays, getDesignerWorkHours } from "../utils";
import { useBookingFlowStore } from "../stores/useBookingFlowStore";
import { useDesignerBookingsQuery } from "../hooks/useDesignerBookingsQuery";
import { ServiceStep } from "./ServiceStep";
import { DesignerStep } from "./DesignerStep";
import { DateTimeStep } from "./DateTimeStep";
import { ConfirmStep } from "./ConfirmStep";

type Props = {
  salon: Salon;
  staff: StaffWithProfile[];
  services: Service[];
  categories: ServiceCategory[];
};

type BookingStep = "service" | "designer" | "datetime" | "confirm";

interface TimeSlot {
  time: string;
  available: boolean;
}

export const BookingView = memo(function BookingView({ salon, staff, services, categories }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const t = useTranslations("booking");
  const tCommon = useTranslations("common");
  const { isAuthenticated, user } = useAuthContext();

  // Zustand store
  const {
    currentStep,
    selectedService,
    selectedDesigner,
    selectedDate,
    selectedTime,
    customerNotes,
    showLoginModal,
    isSubmitting,
    setCurrentStep,
    goToNextStep,
    goToPrevStep,
    setSelectedService,
    setSelectedDesigner,
    setSelectedDate,
    setSelectedTime,
    setCustomerNotes,
    setShowLoginModal,
    setIsSubmitting,
    canProceed,
    getStepCompleted,
    reset,
  } = useBookingFlowStore(
    useShallow((state) => ({
      currentStep: state.currentStep,
      selectedService: state.selectedService,
      selectedDesigner: state.selectedDesigner,
      selectedDate: state.selectedDate,
      selectedTime: state.selectedTime,
      customerNotes: state.customerNotes,
      showLoginModal: state.showLoginModal,
      isSubmitting: state.isSubmitting,
      setCurrentStep: state.setCurrentStep,
      goToNextStep: state.goToNextStep,
      goToPrevStep: state.goToPrevStep,
      setSelectedService: state.setSelectedService,
      setSelectedDesigner: state.setSelectedDesigner,
      setSelectedDate: state.setSelectedDate,
      setSelectedTime: state.setSelectedTime,
      setCustomerNotes: state.setCustomerNotes,
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

  // TanStack Query - 디자이너별 예약 데이터
  const { data: existingBookings = [], isLoading: loadingSlots } = useDesignerBookingsQuery(
    selectedDesigner?.id ?? null,
    selectedDate
  );

  // Generate available dates
  const availableDates = useMemo(() => {
    const days = salon.settings?.booking_advance_days || 30;
    const dates: Date[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    return dates;
  }, [salon.settings?.booking_advance_days]);

  // Check if a date is a salon holiday
  const isSalonHoliday = useCallback((date: Date): boolean => {
    return isDateInHolidays(date, salon.holidays);
  }, [salon.holidays]);

  // Check if a designer is on holiday
  const isDesignerOnHoliday = useCallback((designer: StaffWithProfile, date: Date): boolean => {
    return isDateInHolidays(date, designer.staff_profiles?.holidays || null);
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
    const hours = salon.business_hours?.[dayName];

    if (!hours?.enabled || !hours.open || !hours.close) {
      return [];
    }

    if (selectedDesigner && isDesignerOnHoliday(selectedDesigner, selectedDate)) {
      return [];
    }

    const salonOpenMinutes = hours.open.split(":").map(Number).reduce((h, m) => h * 60 + m);
    const salonCloseMinutes = hours.close.split(":").map(Number).reduce((h, m) => h * 60 + m);

    let effectiveOpen = salonOpenMinutes;
    let effectiveClose = salonCloseMinutes;

    if (selectedDesigner) {
      const designerHours = getDesignerWorkHours(selectedDesigner, dayName);
      if (designerHours.status === "day_off") return [];
      if (designerHours.status === "working") {
        const dStart = designerHours.start.split(":").map(Number).reduce((h, m) => h * 60 + m);
        const dEnd = designerHours.end.split(":").map(Number).reduce((h, m) => h * 60 + m);
        effectiveOpen = Math.max(effectiveOpen, dStart);
        effectiveClose = Math.min(effectiveClose, dEnd);
        if (effectiveOpen >= effectiveClose) return [];
      }
    }

    const slots: TimeSlot[] = [];
    const slotDuration = salon.settings?.slot_duration_minutes || 30;
    const serviceDuration = selectedService.duration_minutes;

    for (let time = effectiveOpen; time + serviceDuration <= effectiveClose; time += slotDuration) {
      const timeStr = formatTime(time);
      const isAvailable = checkSlotAvailable(timeStr, serviceDuration);
      slots.push({ time: timeStr, available: isAvailable });
    }

    return slots;
  }, [selectedDate, selectedService, selectedDesigner, salon.business_hours, salon.settings, isSalonHoliday, isDesignerOnHoliday, checkSlotAvailable]);

  // Handle booking submission
  const handleSubmitBooking = useCallback(async () => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    if (!selectedService || !selectedDesigner || !selectedDate || !selectedTime || !user) {
      return;
    }

    setIsSubmitting(true);
    try {
      const [startHour, startMin] = selectedTime.split(":").map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = startMinutes + selectedService.duration_minutes;
      const endTime = formatTime(endMinutes);

      const booking = await bookingsApi.createBooking({
        salon_id: salon.id,
        customer_id: user.id,
        designer_id: selectedDesigner.id,
        service_id: selectedService.id,
        booking_date: formatDateForDB(selectedDate),
        start_time: selectedTime,
        end_time: endTime,
        duration_minutes: selectedService.duration_minutes,
        status: "PENDING",
        service_price: selectedService.base_price || 0,
        total_price: selectedService.base_price || 0,
        customer_notes: customerNotes || null,
      });

      // 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ["designer-bookings"] });

      router.push(`/bookings/${booking.id}`);
    } catch (error) {
      console.error("Booking error:", error);
      alert(t("bookingFailed"));
    } finally {
      setIsSubmitting(false);
    }
  }, [isAuthenticated, selectedService, selectedDesigner, selectedDate, selectedTime, user, salon.id, customerNotes, queryClient, router, t, setShowLoginModal, setIsSubmitting]);

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
    <div className="bg-white min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between px-4 h-14">
          <button
            onClick={handleBack}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-semibold">{t("title")}</h1>
          <Link href="/" className="p-2 -mr-2 hover:bg-gray-100 rounded-full transition-colors">
            <Home className="w-5 h-5" />
          </Link>
        </div>

        {/* Progress Steps */}
        <div className="flex px-4 pb-3">
          {(["service", "designer", "datetime", "confirm"] as BookingStep[]).map((step, index) => (
            <div key={step} className="flex-1 flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
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

        {currentStep === "designer" && (
          <DesignerStep
            staff={staff}
            selectedDesigner={selectedDesigner}
            onSelect={setSelectedDesigner}
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
            selectedDesigner={selectedDesigner}
            t={t}
          />
        )}

        {currentStep === "confirm" && selectedService && selectedDesigner && selectedDate && selectedTime && (
          <ConfirmStep
            salon={salon}
            service={selectedService}
            designer={selectedDesigner}
            date={selectedDate}
            time={selectedTime}
            notes={customerNotes}
            onNotesChange={setCustomerNotes}
            t={t}
          />
        )}
      </div>

      {/* Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 max-w-[448px] mx-auto">
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
