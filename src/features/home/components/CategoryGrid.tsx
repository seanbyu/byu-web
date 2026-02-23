"use client";

import { memo } from "react";
import Link from "next/link";
import { Scissors, Sun, Sparkles, Smile } from "lucide-react";

// Mock categories for now
const CATEGORIES = [
  { id: "hair", name: "Hair", icon: Scissors, href: "/menus/hair" },
  { id: "nail", name: "Nail", icon: Sun, href: "/menus/nail" },
  { id: "makeup", name: "Makeup", icon: Sparkles, href: "/menus/makeup" },
  { id: "skin", name: "Skin", icon: Smile, href: "/menus/skin" },
];

export const CategoryGrid = memo(function CategoryGrid() {
  return (
    <section className="px-3 py-4 sm:px-4 sm:py-6">
      <div className="grid grid-cols-4 gap-2.5 sm:gap-4">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.id}
            href={cat.href}
            className="touch-target flex flex-col items-center justify-center gap-1.5 rounded-xl sm:gap-2"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-gray-100 bg-gray-50 sm:h-14 sm:w-14">
              <cat.icon className="h-5 w-5 text-gray-700 sm:h-6 sm:w-6" />
            </div>
            <span className="text-[11px] font-medium text-gray-600 sm:text-xs">
              {cat.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
});
