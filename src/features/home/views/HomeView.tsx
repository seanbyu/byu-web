"use client";

import { HomeHeader } from "../components/HomeHeader";
import { HeroBanner } from "../components/HeroBanner";
import { CategoryGrid } from "../components/CategoryGrid";
import { TrendingSection } from "../components/TrendingSection";
import { BottomNav } from "../components/BottomNav";

// Mock Data
const MOCK_DATA = {
  banners: [
    { id: "1", imageUrl: "https://placehold.co/600x800", link: "#" },
    { id: "2", imageUrl: "https://placehold.co/600x800", link: "#" },
    { id: "3", imageUrl: "https://placehold.co/600x800", link: "#" },
  ],
  trendingMenus: [
    {
      id: "1",
      name: "Premium Keratin Treatment & Cut",
      price: 120000,
      duration_minutes: 90,
      shopName: "Salon de Gwanggyo",
      discountRate: 20,
      imageUrl: "https://placehold.co/300x400",
      isLiked: true,
      dDay: 3,
    },
    {
      id: "2",
      name: "Gel Nail Art - Monthly Design",
      price: 55000,
      duration_minutes: 60,
      shopName: "Nail Artists",
      discountRate: 15,
      imageUrl: "https://placehold.co/300x400",
      isLiked: false,
      dDay: 5,
    },
    {
      id: "3",
      name: "Full Body Aromatherapy Massage",
      price: 88000,
      duration_minutes: 60,
      shopName: "Healing Spa",
      discountRate: 10,
      imageUrl: "https://placehold.co/300x400",
      isLiked: true,
    },
    {
      id: "4",
      name: "Eyelash Extension - Natural Volume",
      price: 45000,
      duration_minutes: 45,
      shopName: "Eye Beauty",
      discountRate: 30,
      imageUrl: "https://placehold.co/300x400",
      isLiked: false,
      dDay: 1,
    },
  ],
};

export function HomeView() {
  return (
    <div className="bg-white min-h-screen pb-20">
      <HomeHeader />
      <HeroBanner banners={MOCK_DATA.banners} />
      <CategoryGrid />
      <div className="h-2 bg-gray-50" /> {/* Spacer */}
      <TrendingSection items={MOCK_DATA.trendingMenus} />
      <BottomNav />
    </div>
  );
}
