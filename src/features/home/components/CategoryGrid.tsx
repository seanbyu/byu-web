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
    <section className="px-3 py-3 sm:px-4 sm:py-5">
      <div className="grid grid-cols-4 gap-2 sm:gap-4">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.id}
            href={cat.href}
            className="flex flex-col items-center justify-center gap-1.5 rounded-xl"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-100 bg-gray-50 sm:h-12 sm:w-12">
              <cat.icon className="h-4 w-4 text-gray-700 sm:h-5 sm:w-5" />
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
