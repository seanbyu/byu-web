"use client";

import React, { useState, useCallback } from "react";
import { Home, BookOpen, Heart, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { clsx } from "clsx";
import { useAuthContext } from "../providers/AuthProvider";
import { LoginModal } from "./LoginModal";

interface NavItem {
  id: string;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
  href: "/" | "/search" | "/mypick" | "/my";
  requireAuth?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { id: "home", labelKey: "home", icon: Home, href: "/" },
  { id: "stylingBook", labelKey: "stylingBook", icon: BookOpen, href: "/search" },
  { id: "mypick", labelKey: "mypick", icon: Heart, href: "/mypick", requireAuth: true },
  { id: "my", labelKey: "my", icon: User, href: "/my", requireAuth: true },
];

/**
 * Bottom Navigation with Authentication Support
 *
 * Shows login modal when unauthenticated user clicks on protected nav items
 */
export function AuthBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("nav");

  const { isAuthenticated } = useAuthContext();

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

  const handleNavClick = useCallback(
    (e: React.MouseEvent, item: NavItem) => {
      // If item requires auth and user is not authenticated
      if (item.requireAuth && !isAuthenticated) {
        e.preventDefault();
        setPendingNavigation(item.href);
        setShowLoginModal(true);
        return;
      }
    },
    [isAuthenticated]
  );

  const handleLoginSuccess = useCallback(() => {
    // Navigate to pending destination after successful login
    if (pendingNavigation) {
      router.push(pendingNavigation as "/" | "/search" | "/mypick" | "/my");
    }
    setPendingNavigation(null);
    setShowLoginModal(false);
  }, [pendingNavigation, router]);

  const handleCloseModal = useCallback(() => {
    setShowLoginModal(false);
    setPendingNavigation(null);
  }, []);

  const normalizedPath = pathname?.replace(/^\/(ko|en|th)(?=\/|$)/, "") || pathname;

  const shouldHideNav =
    normalizedPath === "/login" ||
    (normalizedPath?.startsWith("/salon/") && normalizedPath?.endsWith("/booking"));

  if (shouldHideNav) {
    return null;
  }

  return (
    <>
      <nav className="fixed bottom-0 left-1/2 z-50 flex w-full max-w-[var(--app-max-width)] -translate-x-1/2 items-center justify-between border-t border-gray-100 bg-white px-4 py-2 pb-safe shadow-[0_-2px_8px_rgba(0,0,0,0.04)]">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={(e) => handleNavClick(e, item)}
              className="touch-target flex min-w-[3.25rem] flex-col items-center justify-center gap-1 rounded-lg px-2"
            >
              <item.icon
                className={clsx(
                  "w-6 h-6 transition-colors",
                  isActive ? "text-gray-900" : "text-gray-300"
                )}
              />
              <span
                className={clsx(
                  "text-xs font-medium transition-colors",
                  isActive ? "text-gray-900" : "text-gray-300"
                )}
              >
                {t(item.labelKey)}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Login Modal - uses i18n keys */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={handleCloseModal}
        onSuccess={handleLoginSuccess}
        titleKey="loginRequired"
        descriptionKey="loginRequiredMyPage"
      />
    </>
  );
}

export default AuthBottomNav;
