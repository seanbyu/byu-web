"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Home, Search, Share2 } from "lucide-react";
import { Link } from "@/i18n/routing";
import { NotificationBell } from "@/features/notifications/components/NotificationBell";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";

interface PageHeaderProps {
  title?: string;
  showBack?: boolean;
  showHome?: boolean;
  showSearch?: boolean;
  showShare?: boolean;
  showLanguage?: boolean;
  showBell?: boolean;
  onShare?: () => void;
}

export function PageHeader({
  title,
  showBack = true,
  showHome = true,
  showSearch = true,
  showShare = true,
  showLanguage = false,
  showBell = false,
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

  const actionBtnClass = "flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-gray-100";
  const showLangHomeGroup = showLanguage || showHome || showBell;

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
      <div className="flex h-14 items-center justify-between px-4">
        {/* Left Side */}
        <div className="flex min-w-11 items-center">
          {showBack && (
            <button
              onClick={() => router.back()}
              className={actionBtnClass}
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
        <div className="relative flex min-w-11 items-center justify-end gap-1">
          {showLangHomeGroup && (
            <div className="flex items-center gap-0.5 rounded-full">
              {showLanguage && (
                <LanguageSwitcher variant="icon" className={actionBtnClass} />
              )}
              {showBell && <NotificationBell />}
              {showHome && (
                <Link
                  href="/"
                  className={actionBtnClass}
                  aria-label="Home"
                >
                  <Home className="w-5 h-5 text-gray-700" />
                </Link>
              )}
            </div>
          )}
          {showSearch && (
            <button
              className={actionBtnClass}
              aria-label="Search"
            >
              <Search className="w-5 h-5 text-gray-700" />
            </button>
          )}
          {showShare && (
            <button
              onClick={handleShare}
              className={actionBtnClass}
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
