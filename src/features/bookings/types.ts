/**
 * Bookings Feature 타입 정의
 */

import type { useTranslations } from "next-intl";
import type { Salon, StaffWithProfile, Service, ServiceCategory } from "@/lib/supabase/types";

// ============================================
// Common Types
// ============================================

export type BookingStep = "service" | "designer" | "datetime" | "confirm";

export type TimeSlot = {
  time: string;
  available: boolean;
};

// ============================================
// View Props
// ============================================

export type BookingViewProps = {
  salon: Salon;
  staff: StaffWithProfile[];
  services: Service[];
  categories: ServiceCategory[];
};

// ============================================
// Step Component Props
// ============================================

export type ServiceStepProps = {
  services: Service[];
  categories: ServiceCategory[];
  selectedService: Service | null;
  onSelect: (service: Service) => void;
  t: ReturnType<typeof useTranslations>;
};

export type DesignerStepProps = {
  staff: StaffWithProfile[];
  selectedDesigner: StaffWithProfile | null;
  onSelect: (designer: StaffWithProfile) => void;
  t: ReturnType<typeof useTranslations>;
};

export type DateTimeStepProps = {
  availableDates: Date[];
  timeSlots: TimeSlot[];
  selectedDate: Date | null;
  selectedTime: string | null;
  onSelectDate: (date: Date) => void;
  onSelectTime: (time: string) => void;
  loadingSlots: boolean;
  salon: Salon;
  selectedDesigner: StaffWithProfile | null;
  t: ReturnType<typeof useTranslations>;
};

export type ConfirmStepProps = {
  salon: Salon;
  service: Service;
  designer: StaffWithProfile;
  date: Date;
  time: string;
  notes: string;
  onNotesChange: (notes: string) => void;
  t: ReturnType<typeof useTranslations>;
};

export type ServiceCardProps = {
  service: Service;
  selected: boolean;
  onSelect: () => void;
};
