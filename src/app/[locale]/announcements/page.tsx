"use client";

import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/ui/PageHeader";

// Mock data - replace with real data later
const MOCK_ANNOUNCEMENTS = [
  {
    id: "1",
    date: "2025.08.04 12:38",
    title: "[공지] 개인정보처리방침 개정 안내",
  },
];

export default function AnnouncementsPage() {
  const t = useTranslations("auth");

  return (
    <div className="app-page-bleed bg-white">
      <PageHeader
        title={t("myPage.announcements")}
        showBack
        showBell
        showLanguage
        showSearch={false}
        showShare={false}
        showHome={false}
      />

      <div className="divide-y divide-gray-100">
        {MOCK_ANNOUNCEMENTS.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-sm text-gray-400">{t("myPage.announcementsEmpty")}</p>
          </div>
        ) : (
          MOCK_ANNOUNCEMENTS.map((item) => (
            <button
              key={item.id}
              type="button"
              className="flex w-full flex-col gap-1 px-4 py-4 text-left transition-colors hover:bg-gray-50"
            >
              <p className="text-xs text-gray-400">{item.date}</p>
              <p className="text-sm text-gray-900">{item.title}</p>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
