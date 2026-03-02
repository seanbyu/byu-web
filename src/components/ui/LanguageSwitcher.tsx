"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Globe, Check, X } from "lucide-react";
import { useRouter, usePathname } from "@/i18n/routing";
import { useLocale, useTranslations } from "next-intl";

interface Language {
  code: string;
  flag: string;
}

const LANGUAGES: Language[] = [
  { code: "ko", flag: "🇰🇷" },
  { code: "en", flag: "🇺🇸" },
  { code: "th", flag: "🇹🇭" },
];

const FIRST_HOME_LANGUAGE_MODAL_KEY = "first-home-language-modal-v1";

interface LanguageSwitcherProps {
  /** Show as icon only (for header) or full button */
  variant?: "icon" | "button";
  /** Additional class names */
  className?: string;
}

/**
 * Language Switcher Component
 *
 * Best Practice for Tourist/International Users:
 * - Globe icon in header for instant recognition
 * - Bottom sheet modal with flag + native language names
 * - Current language highlighted
 * - Accessible keyboard navigation
 */
export function LanguageSwitcher({
  variant = "icon",
  className = "",
}: LanguageSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const locale = useLocale();
  const tSettings = useTranslations("settings");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const pathname = usePathname();

  const getLanguageLabel = (code: string) => {
    if (code === "ko") return tSettings("languageNames.ko");
    if (code === "en") return tSettings("languageNames.en");
    if (code === "th") return tSettings("languageNames.th");
    return code;
  };

  const currentLanguage = LANGUAGES.find((lang) => lang.code === locale) || LANGUAGES[0];

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // First homepage visit: force English as default and open this modal once
  useEffect(() => {
    if (variant !== "icon") return;
    if (pathname !== "/") return;

    const stored = localStorage.getItem(FIRST_HOME_LANGUAGE_MODAL_KEY);
    if (stored === "done") return;

    if (locale !== "en") {
      localStorage.setItem(FIRST_HOME_LANGUAGE_MODAL_KEY, "pending");
      router.replace(pathname, { locale: "en" });
      return;
    }

    setIsOpen(true);
    localStorage.setItem(FIRST_HOME_LANGUAGE_MODAL_KEY, "done");
  }, [variant, pathname, locale, router]);

  // Change language
  const handleLanguageChange = (langCode: string) => {
    router.replace(pathname, { locale: langCode as "ko" | "en" | "th" });
    localStorage.setItem(FIRST_HOME_LANGUAGE_MODAL_KEY, "done");
    setIsOpen(false);
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`
          flex items-center justify-center gap-1.5
          transition-colors
          ${className}
          ${
            variant === "icon"
              ? "touch-target h-9 w-9 rounded-full text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              : "px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-medium"
          }
        `}
        aria-label={tSettings("languageSelect")}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        {variant === "icon" ? (
          <Globe className="h-4 w-4" />
        ) : (
          <>
            <span>{currentLanguage.flag}</span>
            <span>{getLanguageLabel(currentLanguage.code)}</span>
          </>
        )}
      </button>

      {/* Bottom Sheet Modal - portal to body to escape sticky header stacking context */}
      {isOpen && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[200] flex justify-center">
          {/* Container wrapper - matches project max width */}
          <div className="relative flex h-full w-full max-w-[var(--app-max-width)] items-end">
            {/* Backdrop - only within container */}
            <div
              className="absolute inset-0 bg-black/50 animate-backdrop"
              onClick={() => setIsOpen(false)}
            />

            {/* Modal Content */}
            <div
              className="relative w-full max-h-[min(45dvh,20rem)] overflow-y-auto rounded-t-2xl bg-white shadow-xl animate-slide-up pb-safe"
              role="dialog"
              aria-label={tSettings("languageSelect")}
            >
              {/* Drag Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 bg-gray-300 rounded-full" />
              </div>

              {/* Close Button */}
              <button
                onClick={() => setIsOpen(false)}
                className="touch-target absolute right-3 top-3 rounded-full p-1.5 transition-colors hover:bg-gray-100"
                aria-label={tCommon("close")}
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>

              {/* Header */}
              <div className="px-5 pb-2">
                <h3 className="text-sm font-bold text-gray-900">{tSettings("languageSelect")}</h3>
              </div>

              {/* Language List */}
              <div className="px-4 pb-2" role="listbox" aria-label={tSettings("languageList")}>
                {LANGUAGES.map((language) => (
                  <button
                    key={language.code}
                    onClick={() => handleLanguageChange(language.code)}
                    className={`
                      flex items-center gap-3 w-full px-3 py-3
                      text-left rounded-xl
                      transition-colors
                      ${
                        language.code === locale
                          ? "bg-primary-50"
                          : "hover:bg-gray-50"
                      }
                    `}
                    role="option"
                    aria-selected={language.code === locale}
                  >
                    <span className="text-lg">{language.flag}</span>
                    <span className={`flex-1 text-sm ${
                      language.code === locale
                        ? "text-primary-600 font-semibold"
                        : "text-gray-900"
                    }`}>
                      {getLanguageLabel(language.code)}
                    </span>
                    {language.code === locale && (
                      <Check className="w-4 h-4 text-primary-600" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

export default LanguageSwitcher;
