import { create } from "zustand";

interface FavoritesState {
  // Favorite IDs for quick lookup
  favoriteSalonIds: Set<string>;
  favoriteArtistIds: Set<string>;

  // Actions
  setFavoriteSalonIds: (ids: string[]) => void;
  setFavoriteArtistIds: (ids: string[]) => void;
  addFavoriteSalon: (salonId: string) => void;
  removeFavoriteSalon: (salonId: string) => void;
  addFavoriteArtist: (artistId: string) => void;
  removeFavoriteArtist: (artistId: string) => void;
  isSalonFavorited: (salonId: string) => boolean;
  isArtistFavorited: (artistId: string) => boolean;
  reset: () => void;
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  favoriteSalonIds: new Set(),
  favoriteArtistIds: new Set(),

  setFavoriteSalonIds: (ids) => set({ favoriteSalonIds: new Set(ids) }),
  setFavoriteArtistIds: (ids) => set({ favoriteArtistIds: new Set(ids) }),

  addFavoriteSalon: (salonId) =>
    set((state) => ({
      favoriteSalonIds: new Set([...state.favoriteSalonIds, salonId]),
    })),

  removeFavoriteSalon: (salonId) =>
    set((state) => {
      const next = new Set(state.favoriteSalonIds);
      next.delete(salonId);
      return { favoriteSalonIds: next };
    }),

  addFavoriteArtist: (artistId) =>
    set((state) => ({
      favoriteArtistIds: new Set([...state.favoriteArtistIds, artistId]),
    })),

  removeFavoriteArtist: (artistId) =>
    set((state) => {
      const next = new Set(state.favoriteArtistIds);
      next.delete(artistId);
      return { favoriteArtistIds: next };
    }),

  isSalonFavorited: (salonId) => get().favoriteSalonIds.has(salonId),
  isArtistFavorited: (artistId) => get().favoriteArtistIds.has(artistId),

  reset: () =>
    set({
      favoriteSalonIds: new Set(),
      favoriteArtistIds: new Set(),
    }),
}));
