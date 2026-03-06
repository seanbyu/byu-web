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
  { id: "1", imageUrl: "/banner/1.png", link: "#" },
  { id: "2", imageUrl: "/banner/2.png", link: "#" },
  { id: "3", imageUrl: "/banner/3.png", link: "#" },
  { id: "4", imageUrl: "/banner/4.png", link: "#" },
];

export const HomeView = memo(function HomeView({ salons: initialSalons }: HomeViewProps) {
  // TanStack Query로 데이터 관리 (서버에서 받은 초기 데이터 사용)
  const { data: salons = initialSalons } = useSalonsQuery(initialSalons);

  return (
    <div className="app-page-bleed bg-white">
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
