"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Home,
  Search,
  Share2,
  MapPin,
  Phone,
  Clock,
  Star,
  X,
  ChevronDown,
  Tag,
} from "lucide-react";
import { Link } from "@/i18n/routing";
import { useAuthContext, LoginModal } from "@/features/auth";
import type { Salon, StaffWithProfile, Booking, ServiceCategory, HolidayEntry, WorkSchedule } from "@/lib/supabase/types";
import { getDayName, formatTime, formatDateForDB, isDateInHolidays, getDesignerWorkHours } from "@/features/bookings/utils";
import { createBookingsApi } from "@/features/bookings/api";
import { createSalonsApi } from "../api";

type Props = {
  salon: Salon;
  staff: StaffWithProfile[];
};

interface BookingModalData {
  designer: StaffWithProfile;
  time: string;
}

// Check if salon is currently open
function isOpen(businessHours: Salon["business_hours"]): boolean {
  if (!businessHours) return false;

  const today = getDayName(new Date());
  const todayHours = businessHours[today];

  if (!todayHours?.enabled || !todayHours.open || !todayHours.close) {
    return false;
  }

  const now = new Date();
  const currentTime = now.getHours() * 100 + now.getMinutes();
  const openTime = parseInt(todayHours.open.replace(":", ""));
  const closeTime = parseInt(todayHours.close.replace(":", ""));

  return currentTime >= openTime && currentTime <= closeTime;
}



export function SalonDetailView({ salon, staff }: Props) {
  const t = useTranslations("salon");
  const tBooking = useTranslations("booking");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();

  // Get locale code for date formatting
  const getLocaleCode = () => {
    const localeMap: Record<string, string> = {
      ko: "ko-KR",
      en: "en-US",
      th: "th-TH",
    };
    return localeMap[locale] || "en-US";
  };
  const { isAuthenticated, user } = useAuthContext();

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [bookingModal, setBookingModal] = useState<BookingModalData | null>(null);
  const [existingBookings, setExistingBookings] = useState<Booking[]>([]);
  const [customerNotes, setCustomerNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingBooking, setPendingBooking] = useState<BookingModalData | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const open = isOpen(salon.business_hours);

  // Generate available dates (next 7 days)
  const availableDates = useMemo(() => {
    const dates: Date[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    return dates;
  }, []);

  // Get day label for a date (using i18n)
  const getDayLabel = (date: Date) => {
    const dayName = getDayName(date);
    return tCommon(`days.${dayName}`);
  };

  // Check if a date is a salon holiday
  const isSalonHoliday = (date: Date): boolean => {
    return isDateInHolidays(date, salon.holidays);
  };

  // Check if a date is a designer's holiday (personal holidays + regular day off)
  const isDesignerHoliday = (designer: StaffWithProfile, date: Date): boolean => {
    if (isDateInHolidays(date, designer.staff_profiles?.holidays || null)) return true;
    const dayName = getDayName(date);
    const workResult = getDesignerWorkHours(designer, dayName);
    return workResult.status === "day_off";
  };

  // Check if a date has business hours (and is not a salon holiday)
  const isDateEnabled = (date: Date) => {
    // First check if it's a salon holiday
    if (isSalonHoliday(date)) return false;

    // Then check business hours
    const dayName = getDayName(date);
    const hours = salon.business_hours?.[dayName];
    return hours?.enabled && hours.open && hours.close;
  };

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

  // Get localized category name
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

  // Get salon business hours for a date
  const getSalonHours = (date: Date) => {
    const dayName = getDayName(date);
    const hours = salon.business_hours?.[dayName];
    if (!hours?.enabled || !hours.open || !hours.close) return null;
    return { open: hours.open, close: hours.close };
  };

  // Generate time slots for a specific designer based on both salon and designer hours
  const getDesignerTimeSlots = (designer: StaffWithProfile): string[] => {
    // If salon is closed on this date (holiday or no business hours), return empty
    if (isSalonHoliday(selectedDate)) return [];

    const dayName = getDayName(selectedDate);
    const salonHours = getSalonHours(selectedDate);
    if (!salonHours) return [];

    // If designer is on holiday, return empty
    if (isDesignerHoliday(designer, selectedDate)) return [];

    // Get designer's work schedule for this day
    const designerHours = getDesignerWorkHours(designer, dayName);

    // Determine the effective hours (intersection of salon and designer hours)
    let effectiveStart: string;
    let effectiveEnd: string;

    if (designerHours.status === "day_off") return [];

    if (designerHours.status === "working") {
      // Use the later start time and earlier end time
      const [salonOpenH, salonOpenM] = salonHours.open.split(":").map(Number);
      const [salonCloseH, salonCloseM] = salonHours.close.split(":").map(Number);
      const [designerStartH, designerStartM] = designerHours.start.split(":").map(Number);
      const [designerEndH, designerEndM] = designerHours.end.split(":").map(Number);

      const salonOpenMinutes = salonOpenH * 60 + salonOpenM;
      const salonCloseMinutes = salonCloseH * 60 + salonCloseM;
      const designerStartMinutes = designerStartH * 60 + designerStartM;
      const designerEndMinutes = designerEndH * 60 + designerEndM;

      // Take the intersection (later start, earlier end)
      const startMinutes = Math.max(salonOpenMinutes, designerStartMinutes);
      const endMinutes = Math.min(salonCloseMinutes, designerEndMinutes);

      // If no valid intersection, return empty
      if (startMinutes >= endMinutes) return [];

      effectiveStart = formatTime(startMinutes);
      effectiveEnd = formatTime(endMinutes);
    } else {
      // No designer schedule, use salon hours
      effectiveStart = salonHours.open;
      effectiveEnd = salonHours.close;
    }

    // Generate time slots
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

  // Check if a time slot is available for a specific designer
  const isSlotAvailable = (designerId: string, time: string): boolean => {
    const now = new Date();
    const isToday = selectedDate.toDateString() === now.toDateString();

    const [slotHour, slotMin] = time.split(":").map(Number);
    const slotMinutes = slotHour * 60 + slotMin;

    // Can't book past times (only check for today)
    if (isToday) {
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      if (slotMinutes <= currentMinutes) return false;
    }

    // Check against existing bookings
    const slotDuration = salon.settings?.slot_duration_minutes || 60;
    const slotEnd = slotMinutes + slotDuration;

    for (const booking of existingBookings) {
      if (booking.designer_id !== designerId) continue;

      const [bookingHour, bookingMin] = booking.start_time.split(":").map(Number);
      const bookingStart = bookingHour * 60 + bookingMin;
      const bookingEnd = bookingStart + booking.duration_minutes;

      // Check for overlap
      if (slotMinutes < bookingEnd && slotEnd > bookingStart) {
        return false;
      }
    }

    return true;
  };

  // Get opening time for a date (returns null if holiday or closed)
  const getOpeningTime = (date: Date) => {
    // Check if it's a holiday first
    if (isSalonHoliday(date)) return null;

    const dayName = getDayName(date);
    const hours = salon.business_hours?.[dayName];
    return hours?.enabled && hours.open ? hours.open : null;
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

      // Refresh bookings and close modal
      await fetchBookingsForDate(selectedDate);
      setBookingModal(null);
      setCustomerNotes("");
      setSelectedCategory("");

      // Show success message
      alert(tBooking("bookingConfirmed"));
    } catch (error) {
      console.error("Booking error:", error);
      alert(tBooking("bookingFailed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white min-h-screen pb-6">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="flex items-center justify-between px-4 h-14">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Link href="/" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <Home className="w-5 h-5" />
            </Link>
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <Search className="w-5 h-5" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Cover Image */}
      <div className="relative h-48 bg-gradient-to-br from-purple-100 to-pink-100">
        {salon.cover_image_url ? (
          <img
            src={salon.cover_image_url}
            alt={salon.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-6xl font-bold text-purple-200">
              {salon.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        {/* Status Badge */}
        <div
          className={`absolute bottom-4 left-4 px-3 py-1.5 rounded-full text-sm font-medium shadow-lg ${
            open ? "bg-green-500 text-white" : "bg-gray-800 text-white"
          }`}
        >
          {open ? t("open") : t("closed")}
        </div>
      </div>

      {/* Salon Info */}
      <div className="p-4">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm">
            {salon.logo_url ? (
              <img src={salon.logo_url} alt={salon.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl font-bold text-gray-400">{salon.name.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-gray-900">{salon.name}</h1>
            {salon.address && (
              <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {salon.address}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="h-2 bg-gray-50" />

      {/* Date Selector & Designers with Time Slots */}
      <div className="p-4">
        {/* Section Title */}
        <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-purple-500" />
          {t("hours")}
        </h2>

        {/* Date Selector */}
        <div className="bg-gray-50 rounded-xl p-4 mb-4">
          <div className="grid grid-cols-7 gap-1">
            {availableDates.map((date) => {
              const isSelected = date.toDateString() === selectedDate.toDateString();
              const isEnabled = isDateEnabled(date);
              const isToday = date.toDateString() === new Date().toDateString();
              const openTime = getOpeningTime(date);

              return (
                <button
                  key={date.toISOString()}
                  onClick={() => isEnabled && setSelectedDate(date)}
                  disabled={!isEnabled}
                  className={`py-2 rounded-xl text-center transition-colors ${
                    isSelected
                      ? "bg-purple-100 border-2 border-purple-400"
                      : isEnabled
                      ? "hover:bg-gray-100"
                      : "opacity-50 cursor-not-allowed"
                  }`}
                >
                  <div className={`text-xs font-medium mb-1 ${
                    isSelected ? "text-purple-700" : isToday ? "text-purple-600" : "text-gray-600"
                  }`}>
                    {getDayLabel(date)}
                  </div>
                  <div className={`text-[10px] ${
                    isSelected ? "text-purple-600" : isEnabled ? "text-gray-500" : "text-gray-400"
                  }`}>
                    {openTime || tCommon("closed")}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected Date Display */}
          <div className="mt-3 pt-3 border-t border-gray-200 text-center">
            <span className="text-sm text-gray-600">
              {selectedDate.toLocaleDateString(getLocaleCode(), { month: "long", day: "numeric", weekday: "long" })}
            </span>
          </div>
        </div>

        {/* Business Hours Info Card */}
        {(() => {
          const dayName = getDayName(selectedDate);
          const hours = salon.business_hours?.[dayName];
          const isHoliday = isSalonHoliday(selectedDate) || !hours?.enabled;
          const slotDuration = salon.settings?.slot_duration_minutes || 60;

          // Get regular holidays (days where enabled is false)
          const dayKeys = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;
          const regularHolidays = dayKeys
            .filter((d) => salon.business_hours?.[d] && !salon.business_hours[d].enabled)
            .map((d) => tCommon(`days.${d}`));

          if (isHoliday) {
            return (
              <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-4">
                <div className="text-center text-red-500 font-medium">
                  {t("holiday")}
                </div>
                {regularHolidays.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-red-100 flex justify-between text-sm">
                    <span className="text-gray-500">{t("regularHoliday")}</span>
                    <span className="text-gray-700">{t("everyWeek")} {regularHolidays.join(", ")}</span>
                  </div>
                )}
              </div>
            );
          }

          const openTime = hours!.open!;
          const closeTime = hours!.close!;
          const [closeH, closeM] = closeTime.split(":").map(Number);
          const closeMinutes = closeH * 60 + closeM;
          const lastBookingTime = formatTime(closeMinutes - slotDuration);
          const unitLabel = `${slotDuration}${tCommon("minutes")}`;

          return (
            <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 mb-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">{t("businessHours")}</span>
                <span className="text-gray-700 font-medium">{openTime} - {closeTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{t("lastBooking")}</span>
                <span className="text-gray-700 font-medium">{lastBookingTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{t("bookingUnit")}</span>
                <span className="text-gray-700 font-medium">{unitLabel}</span>
              </div>
              {regularHolidays.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">{t("regularHoliday")}</span>
                  <span className="text-gray-700 font-medium">{t("everyWeek")} {regularHolidays.join(", ")}</span>
                </div>
              )}
            </div>
          );
        })()}

        {/* Designers Section */}
        <h3 className="text-base font-bold flex items-center gap-2 mb-3">
          <Star className="w-4 h-4 text-purple-500" />
          {tBooking("selectDesigner")}
        </h3>

        {staff.length > 0 ? (
          <div className="space-y-4">
            {staff.map((designer) => (
              <div key={designer.id} className="bg-gray-50 rounded-xl p-4">
                {/* Designer Info */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {designer.profile_image ? (
                      <img
                        src={designer.profile_image}
                        alt={designer.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-lg font-bold text-gray-400">
                        {designer.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{designer.name}</p>
                    {designer.staff_profiles?.specialties?.[0] && (
                      <p className="text-xs text-purple-600">
                        {designer.staff_profiles.specialties[0]}
                      </p>
                    )}
                  </div>
                </div>

                {/* Time Slots */}
                {(() => {
                  const salonClosed = isSalonHoliday(selectedDate) || !isDateEnabled(selectedDate);

                  if (salonClosed) {
                    return (
                      <div className="flex flex-wrap gap-2">
                        <p className="text-sm text-gray-400">{tCommon("closed")}</p>
                      </div>
                    );
                  }

                  const isOnHoliday = isDesignerHoliday(designer, selectedDate);

                  if (isOnHoliday) {
                    return (
                      <div className="flex flex-wrap gap-2">
                        <p className="text-sm text-gray-400">{tCommon("closedToday")}</p>
                      </div>
                    );
                  }

                  const designerTimeSlots = getDesignerTimeSlots(designer);

                  return (
                    <div className="flex flex-wrap gap-2">
                      {designerTimeSlots.length > 0 ? (
                        designerTimeSlots.map((time) => {
                          const available = isSlotAvailable(designer.id, time);
                          return (
                            <button
                              key={time}
                              onClick={() => available && handleTimeSlotClick(designer, time)}
                              disabled={!available}
                              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                available
                                  ? "bg-white border border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-400"
                                  : "bg-gray-100 text-gray-400 cursor-not-allowed line-through"
                              }`}
                            >
                              {time}
                            </button>
                          );
                        })
                      ) : (
                        <p className="text-sm text-gray-400">{tCommon("closedToday")}</p>
                      )}
                    </div>
                  );
                })()}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <p>{tBooking("noDesigners")}</p>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="h-2 bg-gray-50" />

      {/* Contact Info */}
      <div className="p-4">
        <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
          <MapPin className="w-5 h-5 text-purple-500" />
          {t("info")}
        </h2>
        <div className="space-y-3">
          {salon.phone && (
            <a href={`tel:${salon.phone}`} className="flex items-center gap-3 text-gray-700 hover:text-purple-600">
              <Phone className="w-5 h-5 text-gray-400" />
              <span className="text-sm">{salon.phone}</span>
            </a>
          )}
          {salon.address && (
            <div className="flex items-start gap-3 text-gray-700">
              <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <span className="text-sm">
                {salon.address}
                {salon.city && `, ${salon.city}`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => {
          setShowLoginModal(false);
          setPendingBooking(null);
        }}
        onSuccess={handleLoginSuccess}
      />

      {/* Booking Confirmation Modal */}
      {bookingModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => {
              setBookingModal(null);
              setSelectedCategory("");
            }}
          />

          {/* Modal */}
          <div className="relative w-full max-w-[448px] bg-white rounded-t-2xl shadow-xl animate-slide-up">
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* Close button */}
            <button
              onClick={() => {
                setBookingModal(null);
                setSelectedCategory("");
              }}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>

            {/* Content */}
            <div className="px-6 pb-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                {tBooking("confirmBooking")}
              </h3>

              {/* Designer Info */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl mb-4">
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                  {bookingModal.designer.profile_image ? (
                    <img
                      src={bookingModal.designer.profile_image}
                      alt={bookingModal.designer.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-lg font-bold text-gray-400">
                      {bookingModal.designer.name.charAt(0)}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{bookingModal.designer.name}</p>
                  <p className="text-sm text-gray-500">{tBooking("designer")}</p>
                </div>
              </div>

              {/* Time Info */}
              <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl mb-4">
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="font-bold text-purple-600 text-lg">{bookingModal.time}</p>
                  <p className="text-sm text-gray-500">
                    {selectedDate.toLocaleDateString(getLocaleCode(), { month: "long", day: "numeric", weekday: "long" })}
                  </p>
                </div>
              </div>

              {/* Category Select */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Tag className="w-4 h-4 inline-block mr-1" />
                  {tBooking("selectCategory")}
                </label>
                {categories.length > 0 ? (
                  <div className="relative">
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none appearance-none bg-white text-sm pr-10"
                    >
                      <option value="" disabled>
                        {tBooking("selectCategoryPlaceholder")}
                      </option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {getCategoryName(category)}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 px-4 py-3 bg-gray-50 rounded-xl">
                    {tBooking("noCategories")}
                  </p>
                )}
              </div>

              {/* Notes */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {tBooking("customerNotes")}
                </label>
                <textarea
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  placeholder={tBooking("customerNotesPlaceholder")}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none resize-none text-sm"
                  rows={3}
                />
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmitBooking}
                disabled={isSubmitting}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white font-semibold py-4 rounded-xl transition-colors"
              >
                {isSubmitting ? tBooking("processing") : tBooking("confirmBooking")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
