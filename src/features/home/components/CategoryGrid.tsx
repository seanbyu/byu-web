import Link from "next/link";
// Icons can be replaced with custom ones or specific lucide icons
import { Scissors, Sun, Sparkles, Smile } from "lucide-react";

// Mock categories for now
const CATEGORIES = [
  { id: "hair", name: "Hair", icon: Scissors, href: "/menus/hair" },
  { id: "nail", name: "Nail", icon: Sun, href: "/menus/nail" },
  { id: "makeup", name: "Makeup", icon: Sparkles, href: "/menus/makeup" },
  { id: "skin", name: "Skin", icon: Smile, href: "/menus/skin" },
];

export function CategoryGrid() {
  return (
    <section className="px-4 py-6">
      <div className="grid grid-cols-4 gap-4">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.id}
            href={cat.href}
            className="flex flex-col items-center gap-2"
          >
            <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center border border-gray-100">
              <cat.icon className="w-6 h-6 text-gray-700" />
            </div>
            <span className="text-xs font-medium text-gray-600">
              {cat.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
