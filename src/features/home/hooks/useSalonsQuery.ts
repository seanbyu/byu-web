import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Salon } from "@/lib/supabase/types";

async function fetchSalons(): Promise<Salon[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("salons")
    .select("*")
    .eq("is_active", true)
    .eq("approval_status", "approved")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching salons:", error);
    return [];
  }

  return data ?? [];
}

export function useSalonsQuery(initialData?: Salon[]) {
  return useQuery({
    queryKey: ["salons"],
    queryFn: fetchSalons,
    initialData,
    staleTime: 60 * 1000, // 1분
    gcTime: 5 * 60 * 1000, // 5분
  });
}
