"use client";

import { memo } from "react";
import { Search, ShoppingCart } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";

export const HomeHeader = memo(function HomeHeader() {
  const tStylingBook = useTranslations("stylingBook");
  const router = useRouter();

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between bg-white px-3 py-2.5 shadow-sm sm:px-4 sm:py-3">
      {/* Search Bar */}
      <div className="mr-2.5 flex-1 sm:mr-3">
        <button
          type="button"
          onClick={() => router.push("/search")}
          className="relative flex w-full items-center rounded-full bg-gray-100 px-3 py-2 text-left sm:px-4"
          aria-label={tStylingBook("title")}
        >
          <Search className="mr-1.5 h-4 w-4 text-gray-400 sm:mr-2" />
          <input
            type="text"
            placeholder={tStylingBook("searchPlaceholder")}
            className="pointer-events-none w-full border-none bg-transparent text-xs outline-none placeholder:text-gray-400 sm:text-sm"
            readOnly // Temporary
          />
        </button>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-1">
        {/* Language Switcher - Globe Icon */}
        <LanguageSwitcher variant="icon" />

        {/* Cart Button */}
        <button className="touch-target relative rounded-full p-1.5">
          <ShoppingCart className="w-5 h-5 text-gray-700" />
          {/* Optional: Cart Badge */}
        </button>
      </div>
    </header>
  );
});
