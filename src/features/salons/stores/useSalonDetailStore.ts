import { create } from "zustand";
import type { StaffWithProfile } from "@/lib/supabase/types";

interface BookingModalData {
  designer: StaffWithProfile;
  time: string;
}

interface SalonDetailState {
  // Calendar state
  selectedDate: Date;
  showCalendar: boolean;
  calendarMonth: Date;

  // Booking state
  bookingModal: BookingModalData | null;
  pendingBooking: BookingModalData | null;
  showLoginModal: boolean;
  customerNotes: string;
  selectedCategory: string;
  isSubmitting: boolean;

  // Actions - Calendar
  setSelectedDate: (date: Date) => void;
  setShowCalendar: (show: boolean) => void;
  setCalendarMonth: (month: Date) => void;

  // Actions - Booking
  setBookingModal: (data: BookingModalData | null) => void;
  setPendingBooking: (data: BookingModalData | null) => void;
  setShowLoginModal: (show: boolean) => void;
  setCustomerNotes: (notes: string) => void;
  setSelectedCategory: (category: string) => void;
  setIsSubmitting: (submitting: boolean) => void;

  // Actions - Combined
  openBookingModal: (designer: StaffWithProfile, time: string) => void;
  closeBookingModal: () => void;
  handleLoginRequired: (designer: StaffWithProfile, time: string) => void;
  handleLoginSuccess: () => void;
  reset: () => void;
}

const initialState = {
  selectedDate: new Date(),
  showCalendar: false,
  calendarMonth: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  bookingModal: null,
  pendingBooking: null,
  showLoginModal: false,
  customerNotes: "",
  selectedCategory: "",
  isSubmitting: false,
};

export const useSalonDetailStore = create<SalonDetailState>((set, get) => ({
  ...initialState,

  // Calendar actions
  setSelectedDate: (date) => set({ selectedDate: date }),
  setShowCalendar: (show) => set({ showCalendar: show }),
  setCalendarMonth: (month) => set({ calendarMonth: month }),

  // Booking actions
  setBookingModal: (data) => set({ bookingModal: data }),
  setPendingBooking: (data) => set({ pendingBooking: data }),
  setShowLoginModal: (show) => set({ showLoginModal: show }),
  setCustomerNotes: (notes) => set({ customerNotes: notes }),
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  setIsSubmitting: (submitting) => set({ isSubmitting: submitting }),

  // Combined actions
  openBookingModal: (designer, time) =>
    set({
      bookingModal: { designer, time },
      customerNotes: "",
      selectedCategory: "",
    }),

  closeBookingModal: () =>
    set({
      bookingModal: null,
      selectedCategory: "",
    }),

  handleLoginRequired: (designer, time) =>
    set({
      pendingBooking: { designer, time },
      showLoginModal: true,
    }),

  handleLoginSuccess: () => {
    const { pendingBooking } = get();
    if (pendingBooking) {
      set({
        showLoginModal: false,
        bookingModal: pendingBooking,
        pendingBooking: null,
      });
    } else {
      set({ showLoginModal: false });
    }
  },

  reset: () => set(initialState),
}));
