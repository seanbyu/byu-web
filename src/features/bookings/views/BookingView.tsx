"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  ArrowLeft,
  Home,
  Check,
  ChevronRight,
  Calendar,
  Clock,
  User,
  Scissors,
} from "lucide-react";
import { Link } from "@/i18n/routing";
import { useAuthContext, LoginModal } from "@/features/auth";
import { createClient } from "@/lib/supabase/client";
import type { Salon, StaffWithProfile, Service, ServiceCategory, Booking, InsertTables } from "@/lib/supabase/types";

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

export function BookingView({ salon, staff, services, categories }: Props) {
  const router = useRouter();
  const t = useTranslations("booking");
  const tCommon = useTranslations("common");
  const { isAuthenticated, user } = useAuthContext();

  // Booking state
  const [currentStep, setCurrentStep] = useState<BookingStep>("service");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDesigner, setSelectedDesigner] = useState<StaffWithProfile | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [customerNotes, setCustomerNotes] = useState("");

  // UI state
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingBookings, setExistingBookings] = useState<Booking[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Fetch existing bookings when designer and date are selected
  useEffect(() => {
    if (selectedDesigner && selectedDate) {
      fetchExistingBookings();
    }
  }, [selectedDesigner, selectedDate]);

  const fetchExistingBookings = async () => {
    if (!selectedDesigner || !selectedDate) return;

    setLoadingSlots(true);
    try {
      const supabase = createClient();
      const dateStr = formatDateForDB(selectedDate);

      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("designer_id", selectedDesigner.id)
        .eq("booking_date", dateStr)
        .not("status", "in", '("CANCELLED","NO_SHOW")');

      if (error) throw error;
      setExistingBookings(data || []);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoadingSlots(false);
    }
  };

  // Generate available dates (next N days based on salon settings)
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

  // Generate time slots for selected date
  const timeSlots = useMemo((): TimeSlot[] => {
    if (!selectedDate || !selectedService) return [];

    const dayName = getDayName(selectedDate);
    const hours = salon.business_hours?.[dayName];

    if (!hours?.enabled || !hours.open || !hours.close) {
      return [];
    }

    const slots: TimeSlot[] = [];
    const slotDuration = salon.settings?.slot_duration_minutes || 30;
    const serviceDuration = selectedService.duration_minutes;

    const [openHour, openMin] = hours.open.split(":").map(Number);
    const [closeHour, closeMin] = hours.close.split(":").map(Number);

    const openMinutes = openHour * 60 + openMin;
    const closeMinutes = closeHour * 60 + closeMin;

    for (let time = openMinutes; time + serviceDuration <= closeMinutes; time += slotDuration) {
      const timeStr = formatTime(time);
      const isAvailable = checkSlotAvailable(timeStr, serviceDuration);
      slots.push({ time: timeStr, available: isAvailable });
    }

    return slots;
  }, [selectedDate, selectedService, existingBookings, salon.business_hours, salon.settings]);

  // Check if a time slot is available
  const checkSlotAvailable = (startTime: string, duration: number): boolean => {
    if (!selectedDate) return false;

    const [startHour, startMin] = startTime.split(":").map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = startMinutes + duration;

    // Check if it's in the past
    const now = new Date();
    if (selectedDate.toDateString() === now.toDateString()) {
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      if (startMinutes <= currentMinutes) return false;
    }

    // Check against existing bookings
    for (const booking of existingBookings) {
      const [bookingHour, bookingMin] = booking.start_time.split(":").map(Number);
      const bookingStart = bookingHour * 60 + bookingMin;
      const bookingEnd = bookingStart + booking.duration_minutes;

      // Check for overlap
      if (startMinutes < bookingEnd && endMinutes > bookingStart) {
        return false;
      }
    }

    return true;
  };

  // Handle booking submission
  const handleSubmitBooking = async () => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    if (!selectedService || !selectedDesigner || !selectedDate || !selectedTime || !user) {
      return;
    }

    setIsSubmitting(true);
    try {
      const supabase = createClient();

      const [startHour, startMin] = selectedTime.split(":").map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = startMinutes + selectedService.duration_minutes;
      const endTime = formatTime(endMinutes);

      const bookingData: InsertTables<"bookings"> = {
        salon_id: salon.id,
        customer_id: user.id,
        customer_user_type: "CUSTOMER",
        designer_id: selectedDesigner.id,
        designer_user_type: "ADMIN_USER",
        service_id: selectedService.id,
        booking_date: formatDateForDB(selectedDate),
        start_time: selectedTime,
        end_time: endTime,
        duration_minutes: selectedService.duration_minutes,
        status: "PENDING",
        service_price: selectedService.base_price || 0,
        total_price: selectedService.base_price || 0,
        customer_notes: customerNotes || null,
      };

      const { data, error } = await supabase
        .from("bookings")
        .insert(bookingData as never)
        .select()
        .single();

      if (error) throw error;

      // Navigate to success/booking detail page
      router.push(`/bookings/${(data as Booking).id}`);
    } catch (error) {
      console.error("Booking error:", error);
      alert(t("bookingFailed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Navigation helpers
  const goToStep = (step: BookingStep) => setCurrentStep(step);

  const canProceed = () => {
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
  };

  const handleNext = () => {
    switch (currentStep) {
      case "service":
        goToStep("designer");
        break;
      case "designer":
        goToStep("datetime");
        break;
      case "datetime":
        goToStep("confirm");
        break;
      case "confirm":
        handleSubmitBooking();
        break;
    }
  };

  const handleBack = () => {
    switch (currentStep) {
      case "designer":
        goToStep("service");
        break;
      case "datetime":
        goToStep("designer");
        break;
      case "confirm":
        goToStep("datetime");
        break;
      default:
        router.back();
    }
  };

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
                    ? "bg-purple-600 text-white"
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
            t={t}
          />
        )}

        {currentStep === "confirm" && (
          <ConfirmStep
            salon={salon}
            service={selectedService!}
            designer={selectedDesigner!}
            date={selectedDate!}
            time={selectedTime!}
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
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl transition-colors"
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

  function getStepCompleted(step: BookingStep): boolean {
    const steps: BookingStep[] = ["service", "designer", "datetime", "confirm"];
    const currentIndex = steps.indexOf(currentStep);
    const stepIndex = steps.indexOf(step);
    return stepIndex < currentIndex;
  }
}

// Service Selection Step
function ServiceStep({
  services,
  categories,
  selectedService,
  onSelect,
  t,
}: {
  services: Service[];
  categories: ServiceCategory[];
  selectedService: Service | null;
  onSelect: (service: Service) => void;
  t: ReturnType<typeof useTranslations>;
}) {
  // Group services by category
  const groupedServices = useMemo(() => {
    const uncategorized: Service[] = [];
    const categorized: Map<string, { category: ServiceCategory; services: Service[] }> = new Map();

    categories.forEach((cat) => {
      categorized.set(cat.id, { category: cat, services: [] });
    });

    services.forEach((service) => {
      if (service.category_id && categorized.has(service.category_id)) {
        categorized.get(service.category_id)!.services.push(service);
      } else {
        uncategorized.push(service);
      }
    });

    return { categorized: Array.from(categorized.values()), uncategorized };
  }, [services, categories]);

  return (
    <div>
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Scissors className="w-5 h-5 text-purple-500" />
        {t("selectService")}
      </h2>

      {/* Categorized Services */}
      {groupedServices.categorized.map(({ category, services: catServices }) => (
        catServices.length > 0 && (
          <div key={category.id} className="mb-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">{category.name}</h3>
            <div className="space-y-2">
              {catServices.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  selected={selectedService?.id === service.id}
                  onSelect={() => onSelect(service)}
                />
              ))}
            </div>
          </div>
        )
      ))}

      {/* Uncategorized Services */}
      {groupedServices.uncategorized.length > 0 && (
        <div className="space-y-2">
          {groupedServices.uncategorized.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              selected={selectedService?.id === service.id}
              onSelect={() => onSelect(service)}
            />
          ))}
        </div>
      )}

      {services.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          {t("noServices")}
        </div>
      )}
    </div>
  );
}

function ServiceCard({
  service,
  selected,
  onSelect,
}: {
  service: Service;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
        selected
          ? "border-purple-500 bg-purple-50"
          : "border-gray-100 hover:border-gray-200"
      }`}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h4 className="font-medium text-gray-900">{service.name}</h4>
          {service.description && (
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{service.description}</p>
          )}
          <div className="flex items-center gap-3 mt-2 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {service.duration_minutes}분
            </span>
          </div>
        </div>
        <div className="text-right">
          {service.base_price && (
            <span className="font-bold text-purple-600">
              ฿{service.base_price.toLocaleString()}
            </span>
          )}
          {selected && (
            <div className="mt-2">
              <Check className="w-5 h-5 text-purple-500 ml-auto" />
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

// Designer Selection Step
function DesignerStep({
  staff,
  selectedDesigner,
  onSelect,
  t,
}: {
  staff: StaffWithProfile[];
  selectedDesigner: StaffWithProfile | null;
  onSelect: (designer: StaffWithProfile) => void;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <div>
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <User className="w-5 h-5 text-purple-500" />
        {t("selectDesigner")}
      </h2>

      <div className="grid grid-cols-2 gap-3">
        {staff.map((designer) => (
          <button
            key={designer.id}
            onClick={() => onSelect(designer)}
            className={`p-4 rounded-xl border-2 text-center transition-all ${
              selectedDesigner?.id === designer.id
                ? "border-purple-500 bg-purple-50"
                : "border-gray-100 hover:border-gray-200"
            }`}
          >
            <div className="w-16 h-16 mx-auto rounded-full bg-gray-100 flex items-center justify-center overflow-hidden mb-3">
              {designer.profile_image ? (
                <img
                  src={designer.profile_image}
                  alt={designer.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xl font-bold text-gray-400">
                  {designer.name.charAt(0)}
                </span>
              )}
            </div>
            <p className="font-medium text-gray-900">{designer.name}</p>
            {designer.staff_profiles?.years_of_experience && (
              <p className="text-xs text-gray-500 mt-1">
                경력 {designer.staff_profiles.years_of_experience}년
              </p>
            )}
            {designer.staff_profiles?.specialties?.[0] && (
              <p className="text-xs text-purple-500 mt-1 truncate">
                {designer.staff_profiles.specialties[0]}
              </p>
            )}
            {selectedDesigner?.id === designer.id && (
              <Check className="w-5 h-5 text-purple-500 mx-auto mt-2" />
            )}
          </button>
        ))}
      </div>

      {staff.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          {t("noDesigners")}
        </div>
      )}
    </div>
  );
}

// Date & Time Selection Step
function DateTimeStep({
  availableDates,
  timeSlots,
  selectedDate,
  selectedTime,
  onSelectDate,
  onSelectTime,
  loadingSlots,
  salon,
  t,
}: {
  availableDates: Date[];
  timeSlots: TimeSlot[];
  selectedDate: Date | null;
  selectedTime: string | null;
  onSelectDate: (date: Date) => void;
  onSelectTime: (time: string) => void;
  loadingSlots: boolean;
  salon: Salon;
  t: ReturnType<typeof useTranslations>;
}) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const daysInMonth = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: (Date | null)[] = [];

    // Add empty slots for days before the first day of the month
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }

    // Add days of the month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  }, [currentMonth]);

  const isDateAvailable = (date: Date) => {
    const dayName = getDayName(date);
    const hours = salon.business_hours?.[dayName];
    if (!hours?.enabled) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return false;

    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + (salon.settings?.booking_advance_days || 30));
    if (date > maxDate) return false;

    return true;
  };

  return (
    <div>
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Calendar className="w-5 h-5 text-purple-500" />
        {t("selectDateTime")}
      </h2>

      {/* Calendar */}
      <div className="bg-gray-50 rounded-xl p-4 mb-6">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
            className="p-2 hover:bg-gray-200 rounded-lg"
          >
            <ChevronRight className="w-5 h-5 rotate-180" />
          </button>
          <span className="font-medium">
            {currentMonth.getFullYear()}년 {currentMonth.getMonth() + 1}월
          </span>
          <button
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
            className="p-2 hover:bg-gray-200 rounded-lg"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["일", "월", "화", "수", "목", "금", "토"].map((day, i) => (
            <div
              key={day}
              className={`text-center text-xs font-medium py-2 ${
                i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : "text-gray-500"
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {daysInMonth.map((date, index) => {
            if (!date) {
              return <div key={`empty-${index}`} className="h-10" />;
            }

            const available = isDateAvailable(date);
            const isSelected = selectedDate?.toDateString() === date.toDateString();
            const isToday = date.toDateString() === new Date().toDateString();

            return (
              <button
                key={date.toISOString()}
                onClick={() => available && onSelectDate(date)}
                disabled={!available}
                className={`h-10 rounded-lg text-sm font-medium transition-colors ${
                  isSelected
                    ? "bg-purple-600 text-white"
                    : available
                    ? isToday
                      ? "bg-purple-100 text-purple-600 hover:bg-purple-200"
                      : "hover:bg-gray-200"
                    : "text-gray-300 cursor-not-allowed"
                }`}
              >
                {date.getDate()}
              </button>
            );
          })}
        </div>
      </div>

      {/* Time Slots */}
      {selectedDate && (
        <div>
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-500" />
            {t("selectTime")}
          </h3>

          {loadingSlots ? (
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : timeSlots.length > 0 ? (
            <div className="grid grid-cols-4 gap-2">
              {timeSlots.map(({ time, available }) => (
                <button
                  key={time}
                  onClick={() => available && onSelectTime(time)}
                  disabled={!available}
                  className={`py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    selectedTime === time
                      ? "bg-purple-600 text-white"
                      : available
                      ? "bg-gray-100 hover:bg-gray-200"
                      : "bg-gray-50 text-gray-300 cursor-not-allowed line-through"
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              {t("noTimeSlotsAvailable")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Confirmation Step
function ConfirmStep({
  salon,
  service,
  designer,
  date,
  time,
  notes,
  onNotesChange,
  t,
}: {
  salon: Salon;
  service: Service;
  designer: StaffWithProfile;
  date: Date;
  time: string;
  notes: string;
  onNotesChange: (notes: string) => void;
  t: ReturnType<typeof useTranslations>;
}) {
  const formatDate = (date: Date) => {
    const days = ["일", "월", "화", "수", "목", "금", "토"];
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 (${days[date.getDay()]})`;
  };

  return (
    <div>
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Check className="w-5 h-5 text-purple-500" />
        {t("confirmBooking")}
      </h2>

      {/* Booking Summary */}
      <div className="bg-gray-50 rounded-xl p-4 space-y-4">
        {/* Salon */}
        <div>
          <p className="text-xs text-gray-500">{t("salon")}</p>
          <p className="font-medium">{salon.name}</p>
        </div>

        {/* Service */}
        <div>
          <p className="text-xs text-gray-500">{t("service")}</p>
          <p className="font-medium">{service.name}</p>
          <p className="text-sm text-gray-500">{service.duration_minutes}분</p>
        </div>

        {/* Designer */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
            {designer.profile_image ? (
              <img
                src={designer.profile_image}
                alt={designer.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-sm font-bold text-gray-400">
                {designer.name.charAt(0)}
              </span>
            )}
          </div>
          <div>
            <p className="text-xs text-gray-500">{t("designer")}</p>
            <p className="font-medium">{designer.name}</p>
          </div>
        </div>

        {/* Date & Time */}
        <div>
          <p className="text-xs text-gray-500">{t("dateTime")}</p>
          <p className="font-medium">{formatDate(date)}</p>
          <p className="text-sm text-gray-600">{time}</p>
        </div>

        {/* Price */}
        <div className="pt-3 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">{t("totalPrice")}</span>
            <span className="text-xl font-bold text-purple-600">
              ฿{(service.base_price || 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="mt-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t("customerNotes")}
        </label>
        <textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder={t("customerNotesPlaceholder")}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none resize-none"
          rows={3}
        />
      </div>
    </div>
  );
}

// Utility functions
function getDayName(date: Date): string {
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  return days[date.getDay()];
}

function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
}

function formatDateForDB(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
}
