import { create } from "zustand";
import type { Service, StaffWithProfile } from "@/lib/supabase/types";

type BookingStep = "service" | "designer" | "datetime" | "confirm";

interface BookingFlowState {
  // Step state
  currentStep: BookingStep;

  // Selection state
  selectedService: Service | null;
  selectedDesigner: StaffWithProfile | null;
  selectedDate: Date | null;
  selectedTime: string | null;
  customerNotes: string;

  // UI state
  showLoginModal: boolean;
  isSubmitting: boolean;

  // Actions - Step
  setCurrentStep: (step: BookingStep) => void;
  goToNextStep: () => void;
  goToPrevStep: () => void;

  // Actions - Selection
  setSelectedService: (service: Service | null) => void;
  setSelectedDesigner: (designer: StaffWithProfile | null) => void;
  setSelectedDate: (date: Date | null) => void;
  setSelectedTime: (time: string | null) => void;
  setCustomerNotes: (notes: string) => void;

  // Actions - UI
  setShowLoginModal: (show: boolean) => void;
  setIsSubmitting: (submitting: boolean) => void;

  // Helpers
  canProceed: () => boolean;
  getStepCompleted: (step: BookingStep) => boolean;
  reset: () => void;
}

const STEPS: BookingStep[] = ["service", "designer", "datetime", "confirm"];

const initialState = {
  currentStep: "service" as BookingStep,
  selectedService: null,
  selectedDesigner: null,
  selectedDate: null,
  selectedTime: null,
  customerNotes: "",
  showLoginModal: false,
  isSubmitting: false,
};

export const useBookingFlowStore = create<BookingFlowState>((set, get) => ({
  ...initialState,

  // Step actions
  setCurrentStep: (step) => set({ currentStep: step }),

  goToNextStep: () => {
    const { currentStep } = get();
    const currentIndex = STEPS.indexOf(currentStep);
    if (currentIndex < STEPS.length - 1) {
      set({ currentStep: STEPS[currentIndex + 1] });
    }
  },

  goToPrevStep: () => {
    const { currentStep } = get();
    const currentIndex = STEPS.indexOf(currentStep);
    if (currentIndex > 0) {
      set({ currentStep: STEPS[currentIndex - 1] });
    }
  },

  // Selection actions
  setSelectedService: (service) => set({ selectedService: service }),
  setSelectedDesigner: (designer) => set({ selectedDesigner: designer }),
  setSelectedDate: (date) => set({ selectedDate: date, selectedTime: null }),
  setSelectedTime: (time) => set({ selectedTime: time }),
  setCustomerNotes: (notes) => set({ customerNotes: notes }),

  // UI actions
  setShowLoginModal: (show) => set({ showLoginModal: show }),
  setIsSubmitting: (submitting) => set({ isSubmitting: submitting }),

  // Helpers
  canProceed: () => {
    const { currentStep, selectedService, selectedDesigner, selectedDate, selectedTime } = get();
    switch (currentStep) {
      case "service":
        return !!selectedService;
      case "designer":
        return !!selectedDesigner;
      case "datetime":
        return !!selectedDate && !!selectedTime;
      case "confirm":
        return true;
      default:
        return false;
    }
  },

  getStepCompleted: (step) => {
    const { currentStep } = get();
    const currentIndex = STEPS.indexOf(currentStep);
    const stepIndex = STEPS.indexOf(step);
    return stepIndex < currentIndex;
  },

  reset: () => set(initialState),
}));
