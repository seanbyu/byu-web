"use client";

import React, { useState, useCallback } from "react";
import { Home, Search, Heart, User } from "lucide-react";
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
  { id: "search", labelKey: "search", icon: Search, href: "/search" },
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

  return (
    <>
      <nav className="sticky bottom-0 z-50 flex items-center justify-between border-t border-gray-100 bg-white px-4 py-2 pb-safe">
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
