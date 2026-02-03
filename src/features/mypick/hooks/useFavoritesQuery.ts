"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthContext } from "@/features/auth";
import { useFavoritesStore } from "../stores/favoritesStore";
import type { Salon, StaffWithProfile } from "@/lib/supabase/types";
import type { ToggleFavoriteResult } from "../types";

// Query Keys
export const favoritesKeys = {
  all: ["favorites"] as const,
  salons: () => [...favoritesKeys.all, "salons"] as const,
  artists: () => [...favoritesKeys.all, "artists"] as const,
  salonIds: () => [...favoritesKeys.salons(), "ids"] as const,
  artistIds: () => [...favoritesKeys.artists(), "ids"] as const,
};

// Fetch favorite salon IDs
async function fetchFavoriteSalonIds(userId: string): Promise<string[]> {
  const supabase = createClient();
  const { data, error } = await (supabase as any)
    .from("user_favorite_salons")
    .select("salon_id")
    .eq("user_id", userId);

  if (error) {
    console.error("Error fetching favorite salon IDs:", error);
    return [];
  }

  return (data as { salon_id: string }[]).map((item) => item.salon_id);
}

// Fetch favorite artist IDs
async function fetchFavoriteArtistIds(userId: string): Promise<string[]> {
  const supabase = createClient();
  const { data, error } = await (supabase as any)
    .from("user_favorite_artists")
    .select("artist_id")
    .eq("user_id", userId);

  if (error) {
    console.error("Error fetching favorite artist IDs:", error);
    return [];
  }

  return (data as { artist_id: string }[]).map((item) => item.artist_id);
}

// Fetch favorite salons with full data
async function fetchFavoriteSalons(userId: string): Promise<Salon[]> {
  const supabase = createClient();
  const { data, error } = await (supabase as any)
    .from("user_favorite_salons")
    .select("salon_id, salons(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return (data as { salon_id: string; salons: Salon | null }[])
    .map((item) => item.salons)
    .filter((salon): salon is Salon => salon !== null);
}

// Fetch favorite artists with full data
async function fetchFavoriteArtists(userId: string): Promise<StaffWithProfile[]> {
  const supabase = createClient();

  // Step 1: Get favorite artist IDs
  const { data: favoriteData, error: favoriteError } = await (supabase as any)
    .from("user_favorite_artists")
    .select("artist_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (favoriteError || !favoriteData || favoriteData.length === 0) return [];

  const artistIds = (favoriteData as { artist_id: string }[]).map((item) => item.artist_id);

  // Step 2: Get artist details from users table (without staff_profiles join to avoid ambiguous relation)
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("id, name, email, profile_image")
    .in("id", artistIds);

  if (userError || !userData) return [];

  // Step 3: Get staff_profiles separately
  const { data: staffData, error: staffError } = await supabase
    .from("staff_profiles")
    .select("*")
    .in("user_id", artistIds);

  // Create a map of staff profiles by user_id
  const staffMap = new Map(
    (staffData || []).map((staff: any) => [staff.user_id, staff])
  );

  // Combine user data with staff profiles
  const artists = (userData as any[]).map((user) => ({
    ...user,
    staff_profiles: staffMap.get(user.id) || null,
  })) as StaffWithProfile[];

  // Maintain the order from favorites
  const artistMap = new Map(artists.map((artist) => [artist.id, artist]));

  const result = artistIds
    .map((id) => artistMap.get(id))
    .filter((artist): artist is StaffWithProfile => artist !== undefined);

  return result;
}

// Toggle salon favorite
async function toggleSalonFavorite(
  userId: string,
  salonId: string,
  isFavorited: boolean
): Promise<ToggleFavoriteResult> {
  const supabase = createClient();

  try {
    if (isFavorited) {
      const { error } = await (supabase as any)
        .from("user_favorite_salons")
        .delete()
        .eq("user_id", userId)
        .eq("salon_id", salonId);

      if (error) throw error;
      return { success: true, isFavorited: false };
    } else {
      const { error } = await (supabase as any)
        .from("user_favorite_salons")
        .insert({ user_id: userId, salon_id: salonId });

      if (error) throw error;
      return { success: true, isFavorited: true };
    }
  } catch (error) {
    console.error("Error toggling salon favorite:", error);
    return { success: false, isFavorited };
  }
}

// Toggle artist favorite
async function toggleArtistFavorite(
  userId: string,
  artistId: string,
  isFavorited: boolean
): Promise<ToggleFavoriteResult> {
  const supabase = createClient();

  try {
    if (isFavorited) {
      const { error } = await (supabase as any)
        .from("user_favorite_artists")
        .delete()
        .eq("user_id", userId)
        .eq("artist_id", artistId);

      if (error) throw error;
      return { success: true, isFavorited: false };
    } else {
      const { error } = await (supabase as any)
        .from("user_favorite_artists")
        .insert({ user_id: userId, artist_id: artistId });

      if (error) throw error;
      return { success: true, isFavorited: true };
    }
  } catch (error) {
    console.error("Error toggling artist favorite:", error);
    return { success: false, isFavorited };
  }
}

// === Hooks ===

// Hook to sync favorite IDs to Zustand store
export function useSyncFavoriteIds() {
  const { user, isAuthenticated } = useAuthContext();
  const { setFavoriteSalonIds, setFavoriteArtistIds, reset } = useFavoritesStore();

  const { data: salonIds } = useQuery({
    queryKey: favoritesKeys.salonIds(),
    queryFn: () => fetchFavoriteSalonIds(user!.id),
    enabled: isAuthenticated && !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const { data: artistIds } = useQuery({
    queryKey: favoritesKeys.artistIds(),
    queryFn: () => fetchFavoriteArtistIds(user!.id),
    enabled: isAuthenticated && !!user?.id,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      reset();
      return;
    }

    if (salonIds) {
      setFavoriteSalonIds(salonIds);
    }
    if (artistIds) {
      setFavoriteArtistIds(artistIds);
    }
  }, [isAuthenticated, salonIds, artistIds, setFavoriteSalonIds, setFavoriteArtistIds, reset]);
}

// Hook to get favorite salons with full data
export function useFavoriteSalons() {
  const { user, isAuthenticated } = useAuthContext();

  return useQuery({
    queryKey: favoritesKeys.salons(),
    queryFn: () => fetchFavoriteSalons(user!.id),
    enabled: isAuthenticated && !!user?.id,
    staleTime: 1000 * 60 * 5,
  });
}

// Hook to get favorite artists with full data
export function useFavoriteArtists() {
  const { user, isAuthenticated } = useAuthContext();

  return useQuery({
    queryKey: favoritesKeys.artists(),
    queryFn: () => fetchFavoriteArtists(user!.id),
    enabled: isAuthenticated && !!user?.id,
    staleTime: 1000 * 60 * 5,
  });
}

// Hook to toggle salon favorite
export function useToggleSalonFavorite() {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const { addFavoriteSalon, removeFavoriteSalon } = useFavoritesStore();

  return useMutation({
    mutationFn: async ({ salonId, isFavorited }: { salonId: string; isFavorited: boolean }) => {
      if (!user?.id) throw new Error("Not authenticated");
      return toggleSalonFavorite(user.id, salonId, isFavorited);
    },
    onMutate: async ({ salonId, isFavorited }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: favoritesKeys.salons() });

      // Snapshot previous value
      const previousSalons = queryClient.getQueryData<Salon[]>(favoritesKeys.salons());

      // Optimistic update for Zustand store
      if (isFavorited) {
        removeFavoriteSalon(salonId);
        // Optimistic update for query cache - remove salon from list
        queryClient.setQueryData<Salon[]>(favoritesKeys.salons(), (old) =>
          old ? old.filter((salon) => salon.id !== salonId) : []
        );
      } else {
        addFavoriteSalon(salonId);
      }

      return { isFavorited, previousSalons };
    },
    onError: (_, { salonId }, context) => {
      // Rollback Zustand store
      if (context?.isFavorited) {
        addFavoriteSalon(salonId);
      } else {
        removeFavoriteSalon(salonId);
      }
      // Rollback query cache
      if (context?.previousSalons) {
        queryClient.setQueryData(favoritesKeys.salons(), context.previousSalons);
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: favoritesKeys.salonIds() });
    },
  });
}

// Hook to toggle artist favorite
export function useToggleArtistFavorite() {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const { addFavoriteArtist, removeFavoriteArtist } = useFavoritesStore();

  return useMutation({
    mutationFn: async ({ artistId, isFavorited }: { artistId: string; isFavorited: boolean }) => {
      if (!user?.id) throw new Error("Not authenticated");
      return toggleArtistFavorite(user.id, artistId, isFavorited);
    },
    onMutate: async ({ artistId, isFavorited }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: favoritesKeys.artists() });

      // Snapshot previous value
      const previousArtists = queryClient.getQueryData<StaffWithProfile[]>(favoritesKeys.artists());

      // Optimistic update for Zustand store
      if (isFavorited) {
        removeFavoriteArtist(artistId);
        // Optimistic update for query cache - remove artist from list
        queryClient.setQueryData<StaffWithProfile[]>(favoritesKeys.artists(), (old) =>
          old ? old.filter((artist) => artist.id !== artistId) : []
        );
      } else {
        addFavoriteArtist(artistId);
      }

      return { isFavorited, previousArtists };
    },
    onError: (_, { artistId }, context) => {
      // Rollback Zustand store
      if (context?.isFavorited) {
        addFavoriteArtist(artistId);
      } else {
        removeFavoriteArtist(artistId);
      }
      // Rollback query cache
      if (context?.previousArtists) {
        queryClient.setQueryData(favoritesKeys.artists(), context.previousArtists);
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: favoritesKeys.artistIds() });
    },
  });
}
