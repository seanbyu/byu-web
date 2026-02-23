"use client";

import { useTranslations } from "next-intl";
import { MessageSquare } from "lucide-react";

export function MyReviewsTab() {
  const t = useTranslations("mypick");

  // TODO: Fetch user reviews from API
  const reviews: unknown[] = [];

  if (reviews.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-14 sm:py-20">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
          <MessageSquare className="w-8 h-8 text-gray-300" />
        </div>
        <p className="mb-1 text-sm font-medium text-gray-500 sm:text-base">{t("reviews.empty")}</p>
        <p className="text-gray-400 text-sm text-center">{t("reviews.emptyDescription")}</p>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4">
      {/* TODO: Render reviews list */}
    </div>
  );
}
