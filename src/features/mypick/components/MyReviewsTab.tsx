"use client";

import { useTranslations } from "next-intl";
import { MessageSquare } from "lucide-react";

export function MyReviewsTab() {
  const t = useTranslations("mypick");

  // TODO: Fetch user reviews from API
  const reviews: unknown[] = [];

  if (reviews.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <MessageSquare className="w-8 h-8 text-gray-300" />
        </div>
        <p className="text-gray-500 font-medium mb-1">{t("reviews.empty")}</p>
        <p className="text-gray-400 text-sm text-center">{t("reviews.emptyDescription")}</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* TODO: Render reviews list */}
    </div>
  );
}
