"use client";

import { useState, useEffect } from "react";
import { Globe, Check, X } from "lucide-react";
import { useRouter, usePathname } from "@/i18n/routing";
import { useLocale } from "next-intl";

interface Language {
  code: string;
  label: string;
  flag: string;
}

const LANGUAGES: Language[] = [
  { code: "ko", label: "한국어", flag: "🇰🇷" },
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "th", label: "ไทย", flag: "🇹🇭" },
];

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
  const router = useRouter();
  const pathname = usePathname();

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

  // Change language
  const handleLanguageChange = (langCode: string) => {
    router.replace(pathname, { locale: langCode as "ko" | "en" | "th" });
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
              ? "w-9 h-9 rounded-full hover:bg-gray-100 text-gray-600 hover:text-gray-900"
              : "px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-medium"
          }
        `}
        aria-label="언어 선택"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        {variant === "icon" ? (
          <Globe className="w-5 h-5" />
        ) : (
          <>
            <span>{currentLanguage.flag}</span>
            <span>{currentLanguage.label}</span>
          </>
        )}
      </button>

      {/* Bottom Sheet Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-center">
          {/* Container wrapper - matches project max width */}
          <div className="relative w-full max-w-[448px] h-full flex items-end">
            {/* Backdrop - only within container */}
            <div
              className="absolute inset-0 bg-black/50 animate-backdrop"
              onClick={() => setIsOpen(false)}
            />

            {/* Modal Content */}
            <div
              className="relative w-full bg-white rounded-t-2xl shadow-xl animate-slide-up"
              role="dialog"
              aria-label="언어 변경"
            >
              {/* Drag Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 bg-gray-300 rounded-full" />
              </div>

              {/* Close Button */}
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="닫기"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>

              {/* Header */}
              <div className="px-6 pb-4">
                <h3 className="text-lg font-bold text-gray-900">언어 변경</h3>
              </div>

              {/* Language List */}
              <div className="px-6 pb-8" role="listbox" aria-label="언어 목록">
                {LANGUAGES.map((language) => (
                  <button
                    key={language.code}
                    onClick={() => handleLanguageChange(language.code)}
                    className={`
                      flex items-center gap-4 w-full px-4 py-4
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
                    <span className="text-2xl">{language.flag}</span>
                    <span className={`flex-1 text-base ${
                      language.code === locale
                        ? "text-primary-600 font-semibold"
                        : "text-gray-900"
                    }`}>
                      {language.label}
                    </span>
                    {language.code === locale && (
                      <Check className="w-5 h-5 text-primary-600" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default LanguageSwitcher;
