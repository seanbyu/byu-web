"use client";

import { memo } from "react";
import { Search } from "lucide-react";
import { useRouter } from "@/i18n/routing";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { NotificationBell } from "@/features/notifications/components/NotificationBell";

export const HomeHeader = memo(function HomeHeader() {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between bg-gradient-to-b from-gray-200 to-white px-4 py-3">
      {/* Logo */}
      <button
        type="button"
        onClick={() => router.push("/")}
        className="text-lg font-bold italic tracking-widest text-gray-800 select-none"
      >
        BYU
      </button>

      {/* Right Actions */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => router.push("/search")}
          className="touch-target flex items-center justify-center rounded-full p-1.5 transition-colors hover:bg-black/10"
          aria-label="검색"
        >
          <Search className="h-5 w-5 text-gray-700" />
        </button>

        <LanguageSwitcher variant="icon" />

        <NotificationBell />
      </div>
    </header>
  );
});
