"use client";

import React, { useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useAuthContext } from "../providers/AuthProvider";
import { useLineAuthUrl } from "../hooks/useLineAuthUrl";
import { getDeviceInfo } from "../utils/device";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  /** Override default title - uses auth.loginRequired if not provided */
  titleKey?: string;
  /** Override default description - uses auth.loginRequiredDesc if not provided */
  descriptionKey?: string;
}

/**
 * Login Modal Component (Internationalized)
 *
 * Mobile-optimized login modal with LINE App-to-App support
 * Supports ko/en/th locales
 */
export function LoginModal({
  isOpen,
  onClose,
  onSuccess,
  titleKey = "loginRequired",
  descriptionKey = "loginRequiredDesc",
}: LoginModalProps) {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");

  const {
    isLoading,
    isAuthenticated,
    liff,
    environment,
    authenticateWithLiff,
  } = useAuthContext();

  const lineAuthUrl = useLineAuthUrl();
  const deviceInfo = getDeviceInfo();

  // Handle successful authentication
  useEffect(() => {
    if (isAuthenticated && isOpen) {
      onSuccess?.();
      onClose();
    }
  }, [isAuthenticated, isOpen, onSuccess, onClose]);

  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  const handleLiffLogin = useCallback(async () => {
    // LIFF environment - use token-based auth
    if (environment === "liff" && liff.isLoggedIn) {
      const result = await authenticateWithLiff();
      if (result.success) {
        onSuccess?.();
      }
    }
  }, [environment, liff, authenticateWithLiff, onSuccess]);

  const isLiffEnv = environment === "liff";

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl
                   shadow-xl transform transition-all
                   max-h-[75vh] overflow-hidden
                   motion-safe:animate-[slideUp_0.3s_ease-out] sm:motion-safe:animate-[fadeIn_0.2s_ease-out]"
        style={{
          animation: "slideUp 0.3s ease-out",
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-modal-title"
      >
        {/* Handle bar for mobile */}
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="touch-target absolute top-4 right-4 rounded-full p-2 text-gray-400 hover:text-gray-600
                     transition-colors hover:bg-gray-100"
          aria-label={tCommon("close")}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        {/* Content */}
        <div className="px-6 pt-5 pb-6 sm:p-8">
          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-line-50 text-line-500">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
          </div>

          {/* Title & Description */}
          <h2
            id="login-modal-title"
            className="text-lg font-bold text-center text-gray-900 mb-2"
          >
            {t(titleKey)}
          </h2>
          <p className="text-sm text-center text-gray-500 mb-5">
            {t(descriptionKey)}
          </p>

          {/* Login Buttons */}
          <div className="space-y-3">
            {/* LINE Login - LIFF: button, Web: <a> tag for iOS Universal Link */}
            {isLiffEnv ? (
              <button
                onClick={handleLiffLogin}
                disabled={isLoading}
                className="ds-btn-line-compact shadow-lg shadow-line-500/20"
              >
                {isLoading ? (
                  <LoadingSpinner />
                ) : (
                  <>
                    <LineIcon />
                    <span>{t("loginWithLine")}</span>
                  </>
                )}
              </button>
            ) : (
              <a
                href={lineAuthUrl}
                className="ds-btn-line-compact shadow-lg shadow-line-500/20"
              >
                <LineIcon />
                <span>{t("loginWithLine")}</span>
              </a>
            )}

            {/* Mobile hint */}
            {deviceInfo.isMobile && (
              <p className="text-xs text-center text-gray-400">
                {t("lineAppWillOpen")}
              </p>
            )}
          </div>

          {/* Terms */}
          <p className="mt-4 text-xs text-center text-gray-400 leading-relaxed">
            {t.rich("termsNotice", {
              terms: (chunks) => (
                <a href="/terms" className="underline hover:text-gray-600">
                  {chunks}
                </a>
              ),
              privacy: (chunks) => (
                <a href="/privacy" className="underline hover:text-gray-600">
                  {chunks}
                </a>
              ),
            })}
          </p>
        </div>
      </div>
    </div>
  );
}

// LINE Icon
function LineIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
    </svg>
  );
}

// Loading Spinner
function LoadingSpinner() {
  return (
    <svg
      className="animate-spin h-5 w-5"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export default LoginModal;
