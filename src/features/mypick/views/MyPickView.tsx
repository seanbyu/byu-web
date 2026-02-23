"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/ui/PageHeader";
import { FavoriteSalonsTab } from "../components/FavoriteSalonsTab";
import { FavoriteArtistsTab } from "../components/FavoriteArtistsTab";
import { MyReviewsTab } from "../components/MyReviewsTab";

type TabType = "salons" | "artists" | "reviews";

export function MyPickView() {
  const t = useTranslations("mypick");
  const [activeTab, setActiveTab] = useState<TabType>("salons");

  const tabs: { id: TabType; label: string }[] = [
    { id: "salons", label: t("tabs.salons") },
    { id: "artists", label: t("tabs.artists") },
    { id: "reviews", label: t("tabs.reviews") },
  ];

  return (
    <div className="app-page-bleed bg-white">
      {/* Common Header */}
      <PageHeader title={t("title")} showSearch={false} />

      {/* Tabs */}
      <div className="sticky top-14 z-10 bg-white border-b border-gray-100">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`touch-target relative flex-1 px-1 py-2.5 text-xs font-medium transition-colors sm:py-3 sm:text-sm ${
                activeTab === tab.id
                  ? "text-primary-600"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="pt-0.5 sm:pt-1">
        {activeTab === "salons" && <FavoriteSalonsTab />}
        {activeTab === "artists" && <FavoriteArtistsTab />}
        {activeTab === "reviews" && <MyReviewsTab />}
      </div>
    </div>
  );
}
