import { create } from "zustand";

interface HomeState {
  // Filter state
  searchQuery: string;
  selectedCategory: string | null;

  // Banner state
  currentBannerIndex: number;

  // Actions
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string | null) => void;
  setCurrentBannerIndex: (index: number) => void;
  nextBanner: (totalBanners: number) => void;
  prevBanner: (totalBanners: number) => void;
  reset: () => void;
}

const initialState = {
  searchQuery: "",
  selectedCategory: null,
  currentBannerIndex: 0,
};

export const useHomeStore = create<HomeState>((set) => ({
  ...initialState,

  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  setCurrentBannerIndex: (index) => set({ currentBannerIndex: index }),

  nextBanner: (totalBanners) =>
    set((state) => ({
      currentBannerIndex: (state.currentBannerIndex + 1) % totalBanners,
    })),

  prevBanner: (totalBanners) =>
    set((state) => ({
      currentBannerIndex:
        (state.currentBannerIndex - 1 + totalBanners) % totalBanners,
    })),

  reset: () => set(initialState),
}));
