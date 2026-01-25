"use client";

import { HomeHeader } from "../components/HomeHeader";
import { HeroBanner } from "../components/HeroBanner";
import { CategoryGrid } from "../components/CategoryGrid";
import { SalonList } from "../components/SalonList";
import { AuthBottomNav } from "@/features/auth";
import { ScrollToTop } from "@/components/ui/ScrollToTop";
import type { Salon } from "@/lib/supabase/types";

// Mock banners - can be replaced with real data later
const MOCK_BANNERS = [
  { id: "1", imageUrl: "https://placehold.co/600x300/f8f4ff/9b87f5?text=Welcome+to+Salon+Store", link: "#" },
  { id: "2", imageUrl: "https://placehold.co/600x300/fff4f8/f587a3?text=Special+Offers", link: "#" },
  { id: "3", imageUrl: "https://placehold.co/600x300/f4fff8/87f5a3?text=New+Salons", link: "#" },
];

type HomeViewProps = {
  salons: Salon[];
};

export function HomeView({ salons }: HomeViewProps) {
  return (
    <div className="bg-white min-h-screen pb-20">
      <HomeHeader />
      <HeroBanner banners={MOCK_BANNERS} />
      <CategoryGrid />
      <div className="h-2 bg-gray-50" />
      <SalonList salons={salons} />

      {/* Floating Elements */}
      <ScrollToTop
        threshold={400}    // Show after scrolling ~1 viewport
        bottomOffset={80}  // Above Bottom Navigation
        rightOffset={20}   // Right margin
      />
      <AuthBottomNav />
    </div>
  );
}
