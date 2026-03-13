"use client";

import React, { useState, useCallback } from "react";
import { Home, BookOpen, CalendarDays, User, Heart } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { clsx } from "clsx";
import { useAuthContext } from "../providers/AuthProvider";
import { LoginModal } from "./LoginModal";

interface NavItem {
  id: string;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
  href: "/" | "/search" | "/mypick" | "/bookings" | "/my";
  requireAuth?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { id: "home", labelKey: "home", icon: Home, href: "/" },
  { id: "stylingBook", labelKey: "stylingBook", icon: BookOpen, href: "/search" },
  { id: "mypick", labelKey: "mypick", icon: Heart, href: "/mypick", requireAuth: true },
  { id: "bookings", labelKey: "bookings", icon: CalendarDays, href: "/bookings", requireAuth: true },
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
      router.push(pendingNavigation as "/" | "/search" | "/mypick" | "/bookings" | "/my");
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
      <nav className="fixed bottom-0 left-1/2 z-50 flex w-full max-w-[var(--app-max-width)] -translate-x-1/2 items-center justify-between border-t border-gray-100 bg-white pb-safe">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={(e) => handleNavClick(e, item)}
              className="flex h-[62px] flex-1 flex-col items-center justify-center gap-1"
            >
              <item.icon
                className={clsx(
                  "h-[22px] w-[22px] transition-colors",
                  isActive ? "text-primary-500" : "text-gray-500"
                )}
              />
              <span
                className={clsx(
                  "text-[10px] font-medium leading-none transition-colors",
                  isActive ? "text-primary-500" : "text-gray-500"
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
