import { useCallback } from "react";
import { useShallow } from "zustand/react/shallow";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations, useLocale } from "next-intl";
import { useAuthContext } from "@/features/auth";
import type { Salon, StaffWithProfile, ServiceCategory } from "@/lib/supabase/types";
import { getDayName, formatTime, formatDateForDB, getDesignerWorkHours } from "@/features/bookings/utils";
import { createBookingsApi } from "@/features/bookings/api";
import { useSalonDetailStore } from "../stores/useSalonDetailStore";
import { useBookingsQuery } from "./useBookingsQuery";
import { useCategoriesQuery } from "./useCategoriesQuery";

type CalendarHelpers = {
  isSalonHoliday: (date: Date) => boolean;
  isDesignerHoliday: (designer: StaffWithProfile, date: Date) => boolean;
  isDateEnabled: (date: Date) => boolean;
};

export function useSalonBooking(
  salon: Salon,
  selectedDate: Date,
  calendarHelpers: CalendarHelpers
) {
  const tBooking = useTranslations("booking");
  const locale = useLocale();
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuthContext();

  // Zustand store
  const {
    bookingModal,
    showLoginModal,
    customerNotes,
    selectedCategory,
    isSubmitting,
    setCustomerNotes,
    setSelectedCategory,
    setIsSubmitting,
    openBookingModal,
    closeBookingModal,
    handleLoginRequired,
    handleLoginSuccess,
    setShowLoginModal,
    setPendingBooking,
  } = useSalonDetailStore(
    useShallow((state) => ({
      bookingModal: state.bookingModal,
      showLoginModal: state.showLoginModal,
      customerNotes: state.customerNotes,
      selectedCategory: state.selectedCategory,
      isSubmitting: state.isSubmitting,
      setCustomerNotes: state.setCustomerNotes,
      setSelectedCategory: state.setSelectedCategory,
      setIsSubmitting: state.setIsSubmitting,
      openBookingModal: state.openBookingModal,
      closeBookingModal: state.closeBookingModal,
      handleLoginRequired: state.handleLoginRequired,
      handleLoginSuccess: state.handleLoginSuccess,
      setShowLoginModal: state.setShowLoginModal,
      setPendingBooking: state.setPendingBooking,
    }))
  );

  const { isSalonHoliday, isDesignerHoliday } = calendarHelpers;

  // TanStack Query - 예약 데이터
  const { data: existingBookings = [] } = useBookingsQuery(salon.id, selectedDate);

  // TanStack Query - 카테고리 데이터 (모달이 열렸을 때만)
  const { data: categories = [] } = useCategoriesQuery(salon.id, !!bookingModal);

  const getCategoryName = useCallback((category: ServiceCategory) => {
    if (locale === "en" && category.name_en) return category.name_en;
    if (locale === "th" && category.name_th) return category.name_th;
    return category.name;
  }, [locale]);

  const getSalonHours = useCallback((date: Date) => {
    const dayName = getDayName(date);
    const hours = salon.business_hours?.[dayName];
    if (!hours?.enabled || !hours.open || !hours.close) return null;
    return { open: hours.open, close: hours.close };
  }, [salon.business_hours]);

  const getDesignerTimeSlots = useCallback((designer: StaffWithProfile): string[] => {
    if (isSalonHoliday(selectedDate)) return [];

    const dayName = getDayName(selectedDate);
    const salonHours = getSalonHours(selectedDate);
    if (!salonHours) return [];

    if (isDesignerHoliday(designer, selectedDate)) return [];

    const designerHours = getDesignerWorkHours(designer, dayName);

    let effectiveStart: string;
    let effectiveEnd: string;

    if (designerHours.status === "day_off") return [];

    if (designerHours.status === "working") {
      const [salonOpenH, salonOpenM] = salonHours.open.split(":").map(Number);
      const [salonCloseH, salonCloseM] = salonHours.close.split(":").map(Number);
      const [designerStartH, designerStartM] = designerHours.start.split(":").map(Number);
      const [designerEndH, designerEndM] = designerHours.end.split(":").map(Number);

      const salonOpenMinutes = salonOpenH * 60 + salonOpenM;
      const salonCloseMinutes = salonCloseH * 60 + salonCloseM;
      const designerStartMinutes = designerStartH * 60 + designerStartM;
      const designerEndMinutes = designerEndH * 60 + designerEndM;

      const startMinutes = Math.max(salonOpenMinutes, designerStartMinutes);
      const endMinutes = Math.min(salonCloseMinutes, designerEndMinutes);

      if (startMinutes >= endMinutes) return [];

      effectiveStart = formatTime(startMinutes);
      effectiveEnd = formatTime(endMinutes);
    } else {
      effectiveStart = salonHours.open;
      effectiveEnd = salonHours.close;
    }

    const slots: string[] = [];
    const slotDuration = salon.settings?.slot_duration_minutes || 60;

    const [startH, startM] = effectiveStart.split(":").map(Number);
    const [endH, endM] = effectiveEnd.split(":").map(Number);

    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    for (let time = startMinutes; time < endMinutes; time += slotDuration) {
      slots.push(formatTime(time));
    }

    return slots;
  }, [selectedDate, isSalonHoliday, isDesignerHoliday, getSalonHours, salon.settings?.slot_duration_minutes]);

  const isSlotAvailable = useCallback((designerId: string, time: string): boolean => {
    const now = new Date();
    const isToday = selectedDate.toDateString() === now.toDateString();

    const [slotHour, slotMin] = time.split(":").map(Number);
    const slotMinutes = slotHour * 60 + slotMin;

    if (isToday) {
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      if (slotMinutes <= currentMinutes) return false;
    }

    const slotDuration = salon.settings?.slot_duration_minutes || 60;
    const slotEnd = slotMinutes + slotDuration;

    for (const booking of existingBookings) {
      if (booking.designer_id !== designerId) continue;

      const [bookingHour, bookingMin] = booking.start_time.split(":").map(Number);
      const bookingStart = bookingHour * 60 + bookingMin;
      const bookingEnd = bookingStart + booking.duration_minutes;

      if (slotMinutes < bookingEnd && slotEnd > bookingStart) {
        return false;
      }
    }

    return true;
  }, [selectedDate, existingBookings, salon.settings?.slot_duration_minutes]);

  const handleTimeSlotClick = useCallback((designer: StaffWithProfile, time: string) => {
    if (!isAuthenticated) {
      handleLoginRequired(designer, time);
      return;
    }
    openBookingModal(designer, time);
  }, [isAuthenticated, handleLoginRequired, openBookingModal]);

  const handleSubmitBooking = useCallback(async () => {
    if (!bookingModal || !user) return;

    setIsSubmitting(true);
    try {
      const api = createBookingsApi();
      const slotDuration = salon.settings?.slot_duration_minutes || 60;

      const [startHour, startMin] = bookingModal.time.split(":").map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endTime = formatTime(startMinutes + slotDuration);

      await api.createBooking({
        salon_id: salon.id,
        customer_id: user.id,
        designer_id: bookingModal.designer.id,
        service_id: null as unknown as string,
        booking_date: formatDateForDB(selectedDate),
        start_time: bookingModal.time,
        end_time: endTime,
        duration_minutes: slotDuration,
        status: "PENDING" as const,
        service_price: 0,
        total_price: 0,
        customer_notes: customerNotes || null,
      });

      // 예약 데이터 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: ["bookings", salon.id, formatDateForDB(selectedDate)],
      });

      closeBookingModal();
      alert(tBooking("bookingConfirmed"));
    } catch (error) {
      console.error("Booking error:", error);
      alert(tBooking("bookingFailed"));
    } finally {
      setIsSubmitting(false);
    }
  }, [bookingModal, user, salon.id, salon.settings?.slot_duration_minutes, selectedDate, customerNotes, queryClient, closeBookingModal, setIsSubmitting, tBooking]);

  return {
    showLoginModal,
    setShowLoginModal,
    bookingModal,
    customerNotes,
    setCustomerNotes,
    isSubmitting,
    pendingBooking: null, // Zustand에서 관리하므로 여기서는 null
    setPendingBooking,
    categories,
    selectedCategory,
    setSelectedCategory,
    getCategoryName,
    getDesignerTimeSlots,
    isSlotAvailable,
    handleTimeSlotClick,
    handleLoginSuccess,
    handleSubmitBooking,
    closeBookingModal,
  };
}
