"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { ArrowLeft, Search, Camera, Scissors, Palette, Wand2, Sparkles } from "lucide-react";
import type { ComponentType } from "react";

type TabKey = "styleTip" | "styleBook" | "salon";

type StyleCategory = {
  id: string;
  icon: ComponentType<{ className?: string }>;
  labelKey: string;
};

const STYLE_CATEGORIES: StyleCategory[] = [
  { id: "haircut", icon: Scissors, labelKey: "styleBook.categories.haircut" },
  { id: "color", icon: Palette, labelKey: "styleBook.categories.color" },
  { id: "perm", icon: Wand2, labelKey: "styleBook.categories.perm" },
  { id: "daily", icon: Sparkles, labelKey: "styleBook.categories.daily" },
];

const MOCK_BOOKS = [1, 2, 3, 4, 5, 6];

const TABS: { key: TabKey; labelKey: string }[] = [
  { key: "styleTip", labelKey: "tabs.styleTip" },
  { key: "styleBook", labelKey: "tabs.styleBook" },
  { key: "salon", labelKey: "tabs.salon" },
];

export function SearchView() {
  const t = useTranslations("search");
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>("styleBook");
  const [query, setQuery] = useState("");

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Search Header */}
      <div className="sticky top-0 z-50 bg-white px-3 py-3 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full transition-colors hover:bg-gray-100"
            aria-label="back"
          >
            <ArrowLeft className="h-5 w-5 text-gray-700" />
          </button>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("placeholder")}
              autoFocus
              className="w-full rounded-full border-2 border-primary-300 bg-gray-50 py-2 pl-9 pr-4 text-sm text-gray-800 outline-none placeholder:text-gray-400 focus:border-primary-500 focus:bg-white"
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-[60px] z-40 bg-white">
        <div className="flex border-b border-gray-100">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "border-b-2 border-primary-500 text-primary-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t(tab.labelKey)}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 px-4 py-4">
        {activeTab === "styleBook" && (
          <div className="space-y-5">
            {/* Style Categories */}
            <section>
              <h3 className="mb-3 text-sm font-semibold text-gray-900">
                {t("styleBook.categoryTitle")}
              </h3>
              <div className="grid grid-cols-4 gap-2.5">
                {STYLE_CATEGORIES.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-gray-100 bg-gray-50 px-1 py-2.5 text-gray-700 transition-colors hover:bg-gray-100"
                    >
                      <Icon className="h-4 w-4 text-primary-600 sm:h-5 sm:w-5" />
                      <span className="text-[11px] font-medium sm:text-xs">
                        {t(item.labelKey)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Book Grid */}
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">
                  {t("styleBook.bookTitle")}
                </h3>
                <span className="text-xs text-gray-400">{t("styleBook.comingSoon")}</span>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {MOCK_BOOKS.map((item) => (
                  <div
                    key={item}
                    className="overflow-hidden rounded-xl border border-gray-100 bg-white"
                  >
                    <div className="aspect-[3/4] bg-gray-100">
                      <div className="flex h-full w-full items-center justify-center text-gray-300">
                        <Camera className="h-6 w-6" />
                      </div>
                    </div>
                    <div className="p-2.5">
                      <p className="text-xs font-medium text-gray-900">
                        {t("styleBook.bookCardTitle")}
                      </p>
                      <p className="mt-0.5 text-[11px] text-gray-500">
                        {t("styleBook.bookCardSubtitle")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === "styleTip" && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Sparkles className="mb-3 h-10 w-10 text-gray-200" />
            <p className="text-sm text-gray-400">{t("styleTip.comingSoon")}</p>
          </div>
        )}

        {activeTab === "salon" && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Search className="mb-3 h-10 w-10 text-gray-200" />
            <p className="text-sm text-gray-400">{t("salon.comingSoon")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
