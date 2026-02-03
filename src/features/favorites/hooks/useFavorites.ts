"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthContext } from "@/features/auth";
import type { Salon, StaffWithProfile } from "@/lib/supabase/types";

export interface FavoriteSalon {
  id: string;
  user_id: string;
  salon_id: string;
  created_at: string;
  salon?: Salon;
}

export interface FavoriteArtist {
  id: string;
  user_id: string;
  artist_id: string;
  created_at: string;
  artist?: StaffWithProfile;
}

// Type for favorite salon response
interface FavoriteSalonResponse {
  salon_id: string;
  salons: Salon | null;
}

// Type for favorite artist response
interface FavoriteArtistResponse {
  artist_id: string;
  users: {
    id: string;
    name: string;
    email: string | null;
    profile_image: string | null;
    staff_profiles: Record<string, unknown> | null;
  } | null;
}

export function useFavorites() {
  const { user, isAuthenticated } = useAuthContext();
  const [favoriteSalonIds, setFavoriteSalonIds] = useState<Set<string>>(new Set());
  const [favoriteArtistIds, setFavoriteArtistIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  // Fetch user's favorite IDs on mount
  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      setFavoriteSalonIds(new Set());
      setFavoriteArtistIds(new Set());
      return;
    }

    const fetchFavorites = async () => {
      const supabase = createClient();

      // Fetch favorite salon IDs (table exists but not in types)
      const { data: salonData } = await (supabase as any)
        .from("user_favorite_salons")
        .select("salon_id")
        .eq("user_id", user.id);

      if (salonData) {
        setFavoriteSalonIds(new Set((salonData as { salon_id: string }[]).map((item) => item.salon_id)));
      }

      // Fetch favorite artist IDs (table exists but not in types)
      const { data: artistData } = await (supabase as any)
        .from("user_favorite_artists")
        .select("artist_id")
        .eq("user_id", user.id);

      if (artistData) {
        setFavoriteArtistIds(new Set((artistData as { artist_id: string }[]).map((item) => item.artist_id)));
      }
    };

    fetchFavorites();
  }, [isAuthenticated, user?.id]);

  // Check if salon is favorited
  const isSalonFavorited = useCallback(
    (salonId: string) => favoriteSalonIds.has(salonId),
    [favoriteSalonIds]
  );

  // Check if artist is favorited
  const isArtistFavorited = useCallback(
    (artistId: string) => favoriteArtistIds.has(artistId),
    [favoriteArtistIds]
  );

  // Toggle salon favorite
  const toggleSalonFavorite = useCallback(
    async (salonId: string): Promise<{ success: boolean; isFavorited: boolean }> => {
      if (!isAuthenticated || !user?.id) {
        return { success: false, isFavorited: false };
      }

      setIsLoading(true);
      const supabase = createClient();
      const isFavorited = favoriteSalonIds.has(salonId);

      try {
        if (isFavorited) {
          // Remove favorite
          const { error } = await (supabase as any)
            .from("user_favorite_salons")
            .delete()
            .eq("user_id", user.id)
            .eq("salon_id", salonId);

          if (error) throw error;

          setFavoriteSalonIds((prev) => {
            const next = new Set(prev);
            next.delete(salonId);
            return next;
          });

          return { success: true, isFavorited: false };
        } else {
          // Add favorite
          const { error } = await (supabase as any)
            .from("user_favorite_salons")
            .insert({ user_id: user.id, salon_id: salonId });

          if (error) throw error;

          setFavoriteSalonIds((prev) => new Set([...prev, salonId]));

          return { success: true, isFavorited: true };
        }
      } catch (error) {
        console.error("Error toggling salon favorite:", error);
        return { success: false, isFavorited };
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated, user?.id, favoriteSalonIds]
  );

  // Toggle artist favorite
  const toggleArtistFavorite = useCallback(
    async (artistId: string): Promise<{ success: boolean; isFavorited: boolean }> => {
      if (!isAuthenticated || !user?.id) {
        return { success: false, isFavorited: false };
      }

      setIsLoading(true);
      const supabase = createClient();
      const isFavorited = favoriteArtistIds.has(artistId);

      try {
        if (isFavorited) {
          // Remove favorite
          const { error } = await (supabase as any)
            .from("user_favorite_artists")
            .delete()
            .eq("user_id", user.id)
            .eq("artist_id", artistId);

          if (error) throw error;

          setFavoriteArtistIds((prev) => {
            const next = new Set(prev);
            next.delete(artistId);
            return next;
          });

          return { success: true, isFavorited: false };
        } else {
          // Add favorite
          const { error } = await (supabase as any)
            .from("user_favorite_artists")
            .insert({ user_id: user.id, artist_id: artistId });

          if (error) throw error;

          setFavoriteArtistIds((prev) => new Set([...prev, artistId]));

          return { success: true, isFavorited: true };
        }
      } catch (error) {
        console.error("Error toggling artist favorite:", error);
        return { success: false, isFavorited };
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated, user?.id, favoriteArtistIds]
  );

  // Get favorite salons with full data
  const getFavoriteSalons = useCallback(async (): Promise<Salon[]> => {
    if (!isAuthenticated || !user?.id) return [];

    const supabase = createClient();
    const { data, error } = await (supabase as any)
      .from("user_favorite_salons")
      .select("salon_id, salons(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error || !data) return [];

    return (data as FavoriteSalonResponse[])
      .map((item) => item.salons)
      .filter((salon): salon is Salon => salon !== null);
  }, [isAuthenticated, user?.id]);

  // Get favorite artists with full data
  const getFavoriteArtists = useCallback(async (): Promise<StaffWithProfile[]> => {
    if (!isAuthenticated || !user?.id) return [];

    const supabase = createClient();

    // Step 1: Get favorite artist IDs
    const { data: favoriteData, error: favoriteError } = await (supabase as any)
      .from("user_favorite_artists")
      .select("artist_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (favoriteError || !favoriteData || favoriteData.length === 0) return [];

    const artistIds = (favoriteData as { artist_id: string }[]).map((item) => item.artist_id);

    // Step 2: Get artist details from users table with staff_profiles
    const { data: artistData, error: artistError } = await supabase
      .from("users")
      .select("id, name, email, profile_image, staff_profiles(*)")
      .in("id", artistIds);

    if (artistError || !artistData) return [];

    // Maintain the order from favorites
    const artistMap = new Map(
      (artistData as unknown as StaffWithProfile[]).map((artist) => [artist.id, artist])
    );

    return artistIds
      .map((id) => artistMap.get(id))
      .filter((artist): artist is StaffWithProfile => artist !== undefined);
  }, [isAuthenticated, user?.id]);

  return {
    isLoading,
    isSalonFavorited,
    isArtistFavorited,
    toggleSalonFavorite,
    toggleArtistFavorite,
    getFavoriteSalons,
    getFavoriteArtists,
    favoriteSalonIds,
    favoriteArtistIds,
  };
}
