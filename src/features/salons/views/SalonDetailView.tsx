"use client";

import { useLocale } from "next-intl";
import { LoginModal } from "@/features/auth";
import { isOpen } from "../utils";
import { useSalonCalendar } from "../hooks/useSalonCalendar";
import { useSalonBooking } from "../hooks/useSalonBooking";
import { SalonHeader } from "../components/SalonHeader";
import { SalonCoverImage } from "../components/SalonCoverImage";
import { SalonCalendar } from "../components/SalonCalendar";
import { DesignerTimeSlots } from "../components/DesignerTimeSlots";
import { BookingConfirmModal } from "../components/BookingConfirmModal";
import { SalonContactInfo } from "../components/SalonContactInfo";
import type { SalonDetailViewProps } from "../types";

export function SalonDetailView({ salon, staff }: SalonDetailViewProps) {
  const locale = useLocale();
  const open = isOpen(salon.business_hours);

  const calendar = useSalonCalendar(salon);
  const booking = useSalonBooking(salon, calendar.selectedDate, {
    isSalonHoliday: calendar.isSalonHoliday,
    isDesignerHoliday: calendar.isDesignerHoliday,
    isDateEnabled: calendar.isDateEnabled,
  });

  return (
    <div className="bg-white min-h-screen pb-6">
      <SalonHeader />

      <SalonCoverImage salon={salon} isOpen={open} />

      <div className="h-2 bg-gray-50" />

      <SalonCalendar
        salon={salon}
        locale={locale}
        selectedDate={calendar.selectedDate}
        setSelectedDate={calendar.setSelectedDate}
        showCalendar={calendar.showCalendar}
        setShowCalendar={calendar.setShowCalendar}
        calendarMonth={calendar.calendarMonth}
        setCalendarMonth={calendar.setCalendarMonth}
        calendarRef={calendar.calendarRef}
        availableDates={calendar.availableDates}
        calendarDays={calendar.calendarDays}
        isDateEnabled={calendar.isDateEnabled}
        isCalendarDateAvailable={calendar.isCalendarDateAvailable}
        getDayLabel={calendar.getDayLabel}
        isSalonHoliday={calendar.isSalonHoliday}
      />

      <div className="px-4">
        <DesignerTimeSlots
          staff={staff}
          selectedDate={calendar.selectedDate}
          isSalonHoliday={calendar.isSalonHoliday}
          isDateEnabled={calendar.isDateEnabled}
          isDesignerHoliday={calendar.isDesignerHoliday}
          getDesignerTimeSlots={booking.getDesignerTimeSlots}
          isSlotAvailable={booking.isSlotAvailable}
          onTimeSlotClick={booking.handleTimeSlotClick}
        />
      </div>

      <div className="h-2 bg-gray-50" />

      <SalonContactInfo salon={salon} />

      <LoginModal
        isOpen={booking.showLoginModal}
        onClose={() => {
          booking.setShowLoginModal(false);
          booking.setPendingBooking(null);
        }}
        onSuccess={booking.handleLoginSuccess}
      />

      {booking.bookingModal && (
        <BookingConfirmModal
          designer={booking.bookingModal.designer}
          time={booking.bookingModal.time}
          selectedDate={calendar.selectedDate}
          locale={locale}
          categories={booking.categories}
          selectedCategory={booking.selectedCategory}
          setSelectedCategory={booking.setSelectedCategory}
          getCategoryName={booking.getCategoryName}
          customerNotes={booking.customerNotes}
          setCustomerNotes={booking.setCustomerNotes}
          isSubmitting={booking.isSubmitting}
          onSubmit={booking.handleSubmitBooking}
          onClose={booking.closeBookingModal}
        />
      )}
    </div>
  );
}
