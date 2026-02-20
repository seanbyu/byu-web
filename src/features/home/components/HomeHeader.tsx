"use client";

import { memo } from "react";
import { Search, ShoppingCart } from "lucide-react";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";

export const HomeHeader = memo(function HomeHeader() {
  return (
    <header className="sticky top-0 z-50 bg-white px-4 py-3 flex items-center justify-between shadow-sm">
      {/* Search Bar */}
      <div className="flex-1 mr-3">
        <div className="relative bg-gray-100 rounded-full px-4 py-2 flex items-center">
          <Search className="w-4 h-4 text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="검색어를 입력해주세요"
            className="bg-transparent border-none outline-none text-sm w-full placeholder:text-gray-400"
            readOnly // Temporary
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-1">
        {/* Language Switcher - Globe Icon */}
        <LanguageSwitcher variant="icon" />

        {/* Cart Button */}
        <button className="touch-target relative rounded-full p-2">
          <ShoppingCart className="w-6 h-6 text-gray-700" />
          {/* Optional: Cart Badge */}
        </button>
      </div>
    </header>
  );
});
