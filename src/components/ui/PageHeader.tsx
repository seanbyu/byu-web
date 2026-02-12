"use client";

import { useRouter, usePathname } from "next/navigation";
import { ArrowLeft, Home, Search, Share2, Globe } from "lucide-react";
import { Link, usePathname as useI18nPathname } from "@/i18n/routing";
import { useLocale } from "next-intl";
import { useState } from "react";

interface PageHeaderProps {
  title?: string;
  showBack?: boolean;
  showHome?: boolean;
  showSearch?: boolean;
  showShare?: boolean;
  showLanguage?: boolean;
  onShare?: () => void;
}

export function PageHeader({
  title,
  showBack = true,
  showHome = true,
  showSearch = true,
  showShare = true,
  showLanguage = false,
  onShare,
}: PageHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const [showLangMenu, setShowLangMenu] = useState(false);

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

  const switchLocale = (newLocale: string) => {
    const segments = pathname?.split("/") || [];
    segments[1] = newLocale;
    router.push(segments.join("/"));
    setShowLangMenu(false);
  };

  const languages = [
    { code: "ko", name: "한국어", flag: "🇰🇷" },
    { code: "en", name: "English", flag: "🇺🇸" },
    { code: "th", name: "ไทย", flag: "🇹🇭" },
  ];

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
        <div className="flex items-center gap-1 relative">
          {showLanguage && (
            <div className="relative">
              <button
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Language"
              >
                <Globe className="w-5 h-5 text-gray-700" />
              </button>

              {/* Language Dropdown */}
              {showLangMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowLangMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[140px] z-50">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => switchLocale(lang.code)}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 ${
                          locale === lang.code ? "bg-primary-50 text-primary-600 font-medium" : "text-gray-700"
                        }`}
                      >
                        <span className="text-lg">{lang.flag}</span>
                        <span>{lang.name}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
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
