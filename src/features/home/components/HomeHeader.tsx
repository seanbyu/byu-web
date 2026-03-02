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
    <header className="sticky top-0 z-50 flex items-center justify-between bg-white px-3 py-2 shadow-sm sm:px-4 sm:py-2.5">
      {/* Search Bar */}
      <div className="mr-2 flex-1 sm:mr-2.5">
        <button
          type="button"
          onClick={() => router.push("/search")}
          className="relative flex w-full items-center rounded-full bg-gray-100 px-3 py-1.5 text-left sm:px-3.5 sm:py-2"
          aria-label={tStylingBook("title")}
        >
          <Search className="mr-1.5 h-[14px] w-[14px] text-gray-400 sm:mr-2" />
          <input
            type="text"
            placeholder={tStylingBook("searchPlaceholder")}
            className="pointer-events-none !min-h-0 w-full border-none bg-transparent !text-[11px] leading-none outline-none placeholder:text-gray-400 sm:!text-xs"
            readOnly // Temporary
          />
        </button>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-0.5">
        {/* Language Switcher - Globe Icon */}
        <LanguageSwitcher variant="icon" />

        {/* Cart Button */}
        <button className="touch-target relative rounded-full p-1">
          <ShoppingCart className="h-[18px] w-[18px] text-gray-700" />
          {/* Optional: Cart Badge */}
        </button>
      </div>
    </header>
  );
});
