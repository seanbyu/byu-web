"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import type { Salon } from "@/lib/supabase/types";

// Client-side fetcher
const fetchSalons = async (): Promise<Salon[]> => {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("salons")
    .select("*")
    .eq("is_active", true)
    .eq("approval_status", "approved")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
};

// SWR hooks for client-side data fetching with deduplication (client-swr-dedup)
export function useSalons(initialData?: Salon[]) {
  return useSWR<Salon[]>("salons", fetchSalons, {
    fallbackData: initialData,
    revalidateOnFocus: false,
    dedupingInterval: 60000, // 1 minute
  });
}
