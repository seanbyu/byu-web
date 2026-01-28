import { useQuery } from "@tanstack/react-query";
import { createSalonsApi } from "../api";

export function useCategoriesQuery(salonId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ["categories", salonId],
    queryFn: async () => {
      const api = createSalonsApi();
      return api.getServiceCategories(salonId);
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5분
  });
}
