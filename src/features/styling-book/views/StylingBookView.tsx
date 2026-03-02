"use client";

import type { ComponentType } from "react";
import { useTranslations } from "next-intl";
import { Scissors, Sparkles, Palette, Camera, Wand2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";

type StylingCategory = {
  id: string;
  icon: ComponentType<{ className?: string }>;
  labelKey: string;
};

const CATEGORIES: StylingCategory[] = [
  { id: "haircut", icon: Scissors, labelKey: "categories.haircut" },
  { id: "color", icon: Palette, labelKey: "categories.color" },
  { id: "perm", icon: Wand2, labelKey: "categories.perm" },
  { id: "daily", icon: Sparkles, labelKey: "categories.daily" },
];

const MOCK_BOOKS = [1, 2, 3, 4, 5, 6];

export function StylingBookView() {
  const t = useTranslations("stylingBook");

  return (
    <div className="app-page-bleed bg-white">
      <PageHeader
        title={t("title")}
        showBack={true}
        showHome={false}
        showSearch={false}
        showShare={false}
        showLanguage={true}
      />

      <div className="app-page-tight app-stack pt-2">
        <section className="overflow-hidden rounded-2xl border border-primary-100 bg-gradient-to-br from-primary-50 via-white to-secondary-50 p-4">
          <p className="text-xs font-semibold text-primary-600">{t("heroBadge")}</p>
          <h2 className="mt-1 text-base font-bold text-gray-900 sm:text-lg">{t("heroTitle")}</h2>
          <p className="mt-1 text-xs text-gray-600 sm:text-sm">{t("heroDescription")}</p>
        </section>

        <section className="app-section">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">{t("categoryTitle")}</h3>
          <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
            {CATEGORIES.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  className="touch-target flex flex-col items-center justify-center gap-1.5 rounded-xl border border-gray-100 bg-gray-50 px-1 py-2.5 text-gray-700 transition-colors hover:bg-gray-100"
                >
                  <Icon className="h-4 w-4 text-primary-600 sm:h-5 sm:w-5" />
                  <span className="text-[11px] font-medium sm:text-xs">{t(item.labelKey)}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="app-section">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">{t("bookTitle")}</h3>
            <span className="text-xs text-gray-500">{t("comingSoon")}</span>
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            {MOCK_BOOKS.map((item) => (
              <div key={item} className="overflow-hidden rounded-xl border border-gray-100 bg-white">
                <div className="aspect-[3/4] bg-gray-100">
                  <div className="flex h-full w-full items-center justify-center text-gray-300">
                    <Camera className="h-6 w-6" />
                  </div>
                </div>
                <div className="p-2.5">
                  <p className="text-xs font-medium text-gray-900">{t("bookCardTitle")}</p>
                  <p className="mt-0.5 text-[11px] text-gray-500">{t("bookCardSubtitle")}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
