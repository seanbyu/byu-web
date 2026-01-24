"use client";

import { Home, Search, Store, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { clsx } from "clsx";

const NAV_ITEMS = [
  { id: "home", labelKey: "home", icon: Home, href: "/" as const },
  { id: "search", labelKey: "search", icon: Search, href: "/search" as const },
  { id: "store", labelKey: "store", icon: Store, href: "/store" as const },
  { id: "my", labelKey: "my", icon: User, href: "/my" as const },
];

export function BottomNav() {
  const pathname = usePathname();
  const t = useTranslations("nav");

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-2 flex justify-between items-center z-50 max-w-[448px] mx-auto pb-safe">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.id}
            href={item.href}
            className="flex flex-col items-center gap-1 min-w-[3rem]"
          >
            <item.icon
              className={clsx(
                "w-6 h-6 transition-colors",
                isActive ? "text-gray-900" : "text-gray-300"
              )}
            />
            <span
              className={clsx(
                "text-[10px] font-medium transition-colors",
                isActive ? "text-gray-900" : "text-gray-300"
              )}
            >
              {t(item.labelKey)}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
