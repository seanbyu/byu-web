/**
 * Salons Feature 타입 정의
 */

import type { RefObject } from "react";
import type { Salon, StaffWithProfile, ServiceCategory, Service } from "@/lib/supabase/types";
import type { SalonStatus } from "./utils";

// ============================================
// View Props
// ============================================

export type SalonDetailViewProps = {
  salon: Salon;
  staff: StaffWithProfile[];
  categories: ServiceCategory[];
  services: Service[];
};

// ============================================
// Component Props
// ============================================

export type SalonCoverImageProps = {
  salon: Salon;
  status: SalonStatus;
};

export type SalonContactInfoProps = {
  salon: Salon;
};

export type SalonCalendarProps = {
  salon: Salon;
  locale: string;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  showCalendar: boolean;
  setShowCalendar: (show: boolean) => void;
  calendarMonth: Date;
  setCalendarMonth: (month: Date) => void;
  calendarRef: RefObject<HTMLDivElement | null>;
  availableDates: Date[];
  calendarDays: (Date | null)[];
  isDateEnabled: (date: Date) => boolean;
  isCalendarDateAvailable: (date: Date) => boolean;
  getDayLabel: (date: Date) => string;
  isSalonHoliday: (date: Date) => boolean;
};

export type BusinessHoursCardProps = {
  salon: Salon;
  selectedDate: Date;
  isSalonHoliday: (date: Date) => boolean;
};

export type DesignerTimeSlotsProps = {
  staff: StaffWithProfile[];
  selectedDate: Date;
  isSalonHoliday: (date: Date) => boolean;
  isDateEnabled: (date: Date) => boolean;
  isDesignerHoliday: (designer: StaffWithProfile, date: Date) => boolean;
  getDesignerTimeSlots: (designer: StaffWithProfile) => string[];
  isSlotAvailable: (designerId: string, time: string) => boolean;
  onTimeSlotClick: (designer: StaffWithProfile, time: string) => void;
};

export type DesignerSlotProps = {
  designer: StaffWithProfile;
  selectedDate: Date;
  isSalonHoliday: (date: Date) => boolean;
  isDateEnabled: (date: Date) => boolean;
  isDesignerHoliday: (designer: StaffWithProfile, date: Date) => boolean;
  getDesignerTimeSlots: (designer: StaffWithProfile) => string[];
  isSlotAvailable: (designerId: string, time: string) => boolean;
  onTimeSlotClick: (designer: StaffWithProfile, time: string) => void;
};

export type BookingConfirmModalProps = {
  designer: StaffWithProfile;
  time: string;
  selectedDate: Date;
  locale: string;
  categories: ServiceCategory[];
  selectedCategory: string;
  setSelectedCategory: (id: string) => void;
  getCategoryName: (category: ServiceCategory) => string;
  customerNotes: string;
  setCustomerNotes: (notes: string) => void;
  isSubmitting: boolean;
  onSubmit: () => void;
  showPhoneConfirmModal: boolean;
  phoneInput: string;
  setPhoneInput: (phone: string) => void;
  phoneValidationError: string;
  onConfirmPhoneSubmit: () => void;
  onCancelPhoneConfirm: () => void;
  onClose: () => void;
};
