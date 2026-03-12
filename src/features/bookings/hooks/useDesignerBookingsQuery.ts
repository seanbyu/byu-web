import { useQuery } from "@tanstack/react-query";
import { bookingsApi } from "../api";
import { formatDateForDB } from "../utils";

export function useArtistBookingsQuery(
  artistId: string | null,
  selectedDate: Date | null
) {
  const dateStr = selectedDate ? formatDateForDB(selectedDate) : "";

  return useQuery({
    queryKey: ["artist-bookings", artistId, dateStr],
    queryFn: () => bookingsApi.getExistingBookings(artistId!, dateStr),
    enabled: !!artistId && !!selectedDate,
    staleTime: 30 * 1000, // 30초
  });
}

export const useDesignerBookingsQuery = useArtistBookingsQuery;
