"use client";

import { memo } from "react";
import { HomeHeader } from "../components/HomeHeader";
import { HeroBanner } from "../components/HeroBanner";
import { CategoryGrid } from "../components/CategoryGrid";
import { SalonList } from "../components/SalonList";
import { ScrollToTop } from "@/components/ui/ScrollToTop";
import { useSalonsQuery } from "../hooks/useSalonsQuery";
import type { HomeViewProps } from "../types";

// Mock banners - can be replaced with real data later
const MOCK_BANNERS = [
  { id: "1", imageUrl: "https://placehold.co/600x300/f8f4ff/9b87f5?text=Welcome+to+Salon+Store", link: "#" },
  { id: "2", imageUrl: "https://placehold.co/600x300/fff4f8/f587a3?text=Special+Offers", link: "#" },
  { id: "3", imageUrl: "https://placehold.co/600x300/f4fff8/87f5a3?text=New+Salons", link: "#" },
];

export const HomeView = memo(function HomeView({ salons: initialSalons }: HomeViewProps) {
  // TanStack Query로 데이터 관리 (서버에서 받은 초기 데이터 사용)
  const { data: salons = initialSalons } = useSalonsQuery(initialSalons);

  return (
    <div className="bg-white min-h-screen pb-20">
      <HomeHeader />
      <HeroBanner banners={MOCK_BANNERS} />
      <CategoryGrid />
      <div className="h-2 bg-gray-50" />
      <SalonList salons={salons} />

      {/* Floating Elements */}
      <ScrollToTop
        threshold={400}
        bottomOffset={80}
        rightOffset={20}
      />
    </div>
  );
});
