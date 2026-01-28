import { useQuery } from "@tanstack/react-query";
import { createBookingsApi } from "@/features/bookings/api";
import { formatDateForDB } from "@/features/bookings/utils";

export function useBookingsQuery(salonId: string, selectedDate: Date) {
  const dateStr = formatDateForDB(selectedDate);

  return useQuery({
    queryKey: ["bookings", salonId, dateStr],
    queryFn: async () => {
      const api = createBookingsApi();
      return api.getBookingsBySalon(salonId, dateStr);
    },
    staleTime: 30 * 1000, // 30초
  });
}
