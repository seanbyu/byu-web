import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useAuthContext } from "@/features/auth";
import type { Salon, StaffWithProfile, Booking, ServiceCategory } from "@/lib/supabase/types";
import { getDayName, formatTime, formatDateForDB, getDesignerWorkHours } from "@/features/bookings/utils";
import { createBookingsApi } from "@/features/bookings/api";
import { createSalonsApi } from "../api";

interface BookingModalData {
  designer: StaffWithProfile;
  time: string;
}

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
  const { isAuthenticated, user } = useAuthContext();

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [bookingModal, setBookingModal] = useState<BookingModalData | null>(null);
  const [existingBookings, setExistingBookings] = useState<Booking[]>([]);
  const [customerNotes, setCustomerNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingBooking, setPendingBooking] = useState<BookingModalData | null>(null);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const { isSalonHoliday, isDesignerHoliday } = calendarHelpers;

  // Fetch existing bookings for selected date
  useEffect(() => {
    fetchBookingsForDate(selectedDate);
  }, [salon.id, selectedDate]);

  // Fetch categories when booking modal opens
  useEffect(() => {
    if (bookingModal) {
      fetchCategories();
    }
  }, [bookingModal]);

  const fetchCategories = async () => {
    try {
      const api = createSalonsApi();
      const categoryData = await api.getServiceCategories(salon.id);
      setCategories(categoryData);
      if (categoryData.length > 0 && !selectedCategory) {
        setSelectedCategory(categoryData[0].id);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const getCategoryName = (category: ServiceCategory) => {
    if (locale === "en" && category.name_en) return category.name_en;
    if (locale === "th" && category.name_th) return category.name_th;
    return category.name;
  };

  const fetchBookingsForDate = async (date: Date) => {
    try {
      const api = createBookingsApi();
      const bookings = await api.getBookingsBySalon(salon.id, formatDateForDB(date));
      setExistingBookings(bookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    }
  };

  const getSalonHours = (date: Date) => {
    const dayName = getDayName(date);
    const hours = salon.business_hours?.[dayName];
    if (!hours?.enabled || !hours.open || !hours.close) return null;
    return { open: hours.open, close: hours.close };
  };

  const getDesignerTimeSlots = (designer: StaffWithProfile): string[] => {
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
  };

  const isSlotAvailable = (designerId: string, time: string): boolean => {
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
  };

  const handleTimeSlotClick = (designer: StaffWithProfile, time: string) => {
    if (!isAuthenticated) {
      setPendingBooking({ designer, time });
      setShowLoginModal(true);
      return;
    }
    setBookingModal({ designer, time });
    setCustomerNotes("");
    setSelectedCategory("");
  };

  const handleLoginSuccess = () => {
    setShowLoginModal(false);
    if (pendingBooking) {
      setBookingModal(pendingBooking);
      setPendingBooking(null);
    }
  };

  const handleSubmitBooking = async () => {
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
        customer_user_type: "CUSTOMER" as const,
        designer_id: bookingModal.designer.id,
        designer_user_type: "ADMIN_USER" as const,
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

      await fetchBookingsForDate(selectedDate);
      setBookingModal(null);
      setCustomerNotes("");
      setSelectedCategory("");

      alert(tBooking("bookingConfirmed"));
    } catch (error) {
      console.error("Booking error:", error);
      alert(tBooking("bookingFailed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeBookingModal = () => {
    setBookingModal(null);
    setSelectedCategory("");
  };

  return {
    showLoginModal,
    setShowLoginModal,
    bookingModal,
    customerNotes,
    setCustomerNotes,
    isSubmitting,
    pendingBooking,
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
