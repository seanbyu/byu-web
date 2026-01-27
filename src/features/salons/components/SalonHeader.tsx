"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Home, Search, Share2 } from "lucide-react";
import { Link } from "@/i18n/routing";

export function SalonHeader() {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
      <div className="flex items-center justify-between px-4 h-14">
        <button
          onClick={() => router.back()}
          className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <Link href="/" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <Home className="w-5 h-5" />
          </Link>
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <Search className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
