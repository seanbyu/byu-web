import type { Salon, StaffWithProfile } from "@/lib/supabase/types";

// Favorite Salon Types
export interface FavoriteSalon {
  id: string;
  user_id: string;
  salon_id: string;
  created_at: string;
}

export interface FavoriteSalonWithDetails extends FavoriteSalon {
  salon: Salon;
}

// Favorite Artist Types
export interface FavoriteArtist {
  id: string;
  user_id: string;
  artist_id: string;
  created_at: string;
}

export interface FavoriteArtistWithDetails extends FavoriteArtist {
  artist: StaffWithProfile;
}

// API Response Types
export interface FavoriteSalonResponse {
  salon_id: string;
  salons: Salon | null;
}

export interface ToggleFavoriteResult {
  success: boolean;
  isFavorited: boolean;
}

// Tab Types
export type MyPickTabType = "salons" | "artists" | "reviews";
