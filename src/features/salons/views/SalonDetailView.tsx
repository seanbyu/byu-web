"use client";

import { useEffect } from "react";
import { useLocale } from "next-intl";
import { LoginModal } from "@/features/auth";
import { getSalonStatus } from "../utils";
import { useSalonCalendar } from "../hooks/useSalonCalendar";
import { useSalonBooking } from "../hooks/useSalonBooking";
import { useSalonDetailStore } from "../stores/useSalonDetailStore";
import { SalonHeader } from "../components/SalonHeader";
import { SalonCoverImage } from "../components/SalonCoverImage";
import { SalonCalendar } from "../components/SalonCalendar";
import { SalonContactChannels } from "../components/SalonContactChannels";
import { DesignerTimeSlots } from "../components/DesignerTimeSlots";
import { BookingConfirmModal } from "../components/BookingConfirmModal";
import { BookingSuccessModal } from "../components/BookingSuccessModal";
import { SalonContactInfo } from "../components/SalonContactInfo";
import type { SalonDetailViewProps } from "../types";

export function SalonDetailView({ salon, staff, categories, services }: SalonDetailViewProps) {
  const locale = useLocale();
  const status = getSalonStatus(salon.business_hours);

  // 전역 스토어를 살롱 페이지 진입 시 초기화 (이전 방문의 stale state 방지)
  useEffect(() => {
    useSalonDetailStore.getState().reset();
  }, []);

  const calendar = useSalonCalendar(salon);
  const booking = useSalonBooking(salon, calendar.selectedDate, {
    isSalonHoliday: calendar.isSalonHoliday,
    isDesignerHoliday: calendar.isDesignerHoliday,
    isDateEnabled: calendar.isDateEnabled,
  }, { categories, services });

  return (
    <div className="app-page-bleed bg-white">
      <SalonHeader />

      <SalonCoverImage salon={salon} status={status} />

      <SalonContactChannels salon={salon} />

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

      <div className="px-3 sm:px-4">
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
          categoryLastBookingTimes={(salon.settings as Record<string, unknown> | null)?.category_last_booking_times as Record<string, string> | undefined}
          selectedCategory={booking.selectedCategory}
          setSelectedCategory={booking.setSelectedCategory}
          getCategoryName={booking.getCategoryName}
          customerNotes={booking.customerNotes}
          setCustomerNotes={booking.setCustomerNotes}
          isSubmitting={booking.isSubmitting}
          onSubmit={booking.handleSubmitBooking}
          showPhoneConfirmModal={booking.showPhoneConfirmModal}
          phoneInput={booking.phoneInput}
          setPhoneInput={booking.setPhoneInput}
          phoneValidationError={booking.phoneValidationError}
          onConfirmPhoneSubmit={booking.handleConfirmPhoneAndSubmit}
          onCancelPhoneConfirm={booking.handleCancelPhoneConfirm}
          onClose={booking.closeBookingModal}
        />
      )}

      {booking.showSuccessModal && (
        <BookingSuccessModal
          bookingId={booking.successBookingId}
          salonId={salon.id}
          lineChannel={booking.lineChannel}
          onClose={booking.closeSuccessModal}
        />
      )}
    </div>
  );
}
