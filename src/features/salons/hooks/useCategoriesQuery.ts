import { useQuery } from "@tanstack/react-query";
import type { ServiceCategory } from "@/lib/supabase/types";
import { salonsApi } from "../api";

export function useCategoriesQuery(
  salonId: string,
  enabled: boolean = true,
  initialData?: ServiceCategory[]
) {
  return useQuery({
    queryKey: ["categories", salonId],
    queryFn: () => salonsApi.getServiceCategories(salonId),
    enabled,
    staleTime: 5 * 60 * 1000,
    initialData,
  });
}
