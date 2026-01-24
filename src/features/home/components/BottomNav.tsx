import Link from "next/link";
import { Home, Search, Store, User } from "lucide-react";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";

const NAV_ITEMS = [
  { id: "home", label: "홈", icon: Home, href: "/" },
  { id: "search", label: "검색", icon: Search, href: "/search" },
  { id: "store", label: "스토어", icon: Store, href: "/store" },
  { id: "my", label: "마이", icon: User, href: "/my" },
];

export function BottomNav() {
  const pathname = usePathname();

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
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
