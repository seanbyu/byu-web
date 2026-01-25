"use client";

import { useState, useRef, useEffect } from "react";
import { Globe } from "lucide-react";
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
 * - Dropdown with flag + native language names
 * - Current language highlighted
 * - Accessible keyboard navigation
 */
export function LanguageSwitcher({
  variant = "icon",
  className = "",
}: LanguageSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const currentLanguage = LANGUAGES.find((lang) => lang.code === locale) || LANGUAGES[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      setIsOpen(false);
    }
  };

  // Change language
  const handleLanguageChange = (langCode: string) => {
    router.replace(pathname, { locale: langCode as "ko" | "en" | "th" });
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`} onKeyDown={handleKeyDown}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center justify-center gap-1.5
          transition-colors
          ${
            variant === "icon"
              ? "w-9 h-9 rounded-full hover:bg-gray-100 text-gray-600 hover:text-gray-900"
              : "px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-medium"
          }
        `}
        aria-label="언어 선택"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
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

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2
                     w-40 py-1
                     bg-white rounded-xl
                     shadow-lg shadow-black/10
                     border border-gray-100
                     z-50
                     animate-fade-in"
          role="listbox"
          aria-label="언어 목록"
        >
          {LANGUAGES.map((language) => (
            <button
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              className={`
                flex items-center gap-3 w-full px-4 py-2.5
                text-left text-sm
                transition-colors
                ${
                  language.code === locale
                    ? "bg-green-50 text-green-700 font-medium"
                    : "text-gray-700 hover:bg-gray-50"
                }
              `}
              role="option"
              aria-selected={language.code === locale}
            >
              <span className="text-lg">{language.flag}</span>
              <span>{language.label}</span>
              {language.code === locale && (
                <svg
                  className="w-4 h-4 ml-auto text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default LanguageSwitcher;
