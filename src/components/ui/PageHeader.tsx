"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Home, Search, Share2 } from "lucide-react";
import { Link } from "@/i18n/routing";

interface PageHeaderProps {
  title?: string;
  showBack?: boolean;
  showHome?: boolean;
  showSearch?: boolean;
  showShare?: boolean;
  onShare?: () => void;
}

export function PageHeader({
  title,
  showBack = true,
  showHome = true,
  showSearch = true,
  showShare = true,
  onShare,
}: PageHeaderProps) {
  const router = useRouter();

  const handleShare = async () => {
    if (onShare) {
      onShare();
      return;
    }

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: title || document.title,
          url: window.location.href,
        });
      } catch {
        // User cancelled or share failed
      }
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
      <div className="flex items-center justify-between px-4 h-14">
        {/* Left Side */}
        <div className="flex items-center">
          {showBack && (
            <button
              onClick={() => router.back()}
              className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
          )}
        </div>

        {/* Center - Title (optional) */}
        {title && (
          <h1 className="absolute left-1/2 -translate-x-1/2 text-base font-semibold text-gray-900">
            {title}
          </h1>
        )}

        {/* Right Side */}
        <div className="flex items-center gap-1">
          {showHome && (
            <Link
              href="/"
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Home"
            >
              <Home className="w-5 h-5 text-gray-700" />
            </Link>
          )}
          {showSearch && (
            <button
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Search"
            >
              <Search className="w-5 h-5 text-gray-700" />
            </button>
          )}
          {showShare && (
            <button
              onClick={handleShare}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Share"
            >
              <Share2 className="w-5 h-5 text-gray-700" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
