import { useQuery } from "@tanstack/react-query";
import { bookingsApi } from "../api";
import { formatDateForDB } from "../utils";

export function useDesignerBookingsQuery(
  designerId: string | null,
  selectedDate: Date | null
) {
  const dateStr = selectedDate ? formatDateForDB(selectedDate) : "";

  return useQuery({
    queryKey: ["designer-bookings", designerId, dateStr],
    queryFn: () => bookingsApi.getExistingBookings(designerId!, dateStr),
    enabled: !!designerId && !!selectedDate,
    staleTime: 30 * 1000, // 30초
  });
}
