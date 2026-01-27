import { createClient } from "@/lib/supabase/client";
import type { ServiceCategory } from "@/lib/supabase/types";

export const createSalonsApi = (client?: ReturnType<typeof createClient>) => {
  const supabase = client ?? createClient();

  return {
    getServiceCategories: async (
      salonId: string
    ): Promise<ServiceCategory[]> => {
      const { data, error } = await supabase
        .from("service_categories")
        .select("*")
        .eq("salon_id", salonId)
        .eq("is_active", true)
        .is("deleted_at", null)
        .order("display_order", { ascending: true });

      if (error) throw error;
      return (data as ServiceCategory[]) || [];
    },
  };
};
