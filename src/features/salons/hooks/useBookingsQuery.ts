import { useQuery } from "@tanstack/react-query";
import { bookingsApi } from "@/features/bookings/api";
import { formatDateForDB } from "@/features/bookings/utils";

export function useBookingsQuery(salonId: string, selectedDate: Date) {
  const dateStr = formatDateForDB(selectedDate);

  return useQuery({
    queryKey: ["bookings", salonId, dateStr],
    queryFn: () => bookingsApi.getBookingsBySalon(salonId, dateStr),
    staleTime: 30 * 1000, // 30초
  });
}
