"use client";

import React, { useCallback } from "react";
import { useTranslations } from "next-intl";
import { useAuthContext } from "../providers/AuthProvider";
import { LiffService } from "../services/liff-service";

interface LineLoginButtonProps {
  className?: string;
  children?: React.ReactNode;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

/**
 * LINE Login Button Component
 *
 * Automatically detects environment and uses appropriate auth flow:
 * - Web: Supabase OAuth redirect flow
 * - LIFF: LIFF SDK token-based authentication
 */
export function LineLoginButton({
  className,
  children,
  onSuccess,
  onError,
}: LineLoginButtonProps) {
  const t = useTranslations("auth");
  const {
    isLoading,
    isAuthenticated,
    environment,
    liff,
    authenticateWithLiff,
  } = useAuthContext();

  const handleLogin = useCallback(async () => {
    try {
      // LIFF environment: use LIFF SDK authentication
      if (environment === "liff" || LiffService.detectLiffEnvironment()) {
        if (liff.isLoggedIn && liff.idToken) {
          // Already logged in to LINE, authenticate with Supabase
          const result = await authenticateWithLiff();
          if (result.success) {
            onSuccess?.();
          } else {
            onError?.(result.error || "LIFF authentication failed");
          }
        } else {
          // Not logged in to LINE, trigger LIFF login
          // This will redirect to LINE login
          window.liff?.login();
        }
        return;
      }

      // Web environment: redirect to LINE OAuth
      window.location.href = "/api/auth/line";
    } catch (error) {
      onError?.(error instanceof Error ? error.message : "Login failed");
    }
  }, [environment, liff, authenticateWithLiff, onSuccess, onError]);

  if (isAuthenticated) {
    return null;
  }

  return (
    <button
      onClick={handleLogin}
      disabled={isLoading}
      className={
        className ||
        "ds-btn-line-compact"
      }
    >
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <>
          <LineIcon />
          {children || t("loginWithLine")}
        </>
      )}
    </button>
  );
}

// LINE Icon SVG
function LineIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 2C6.48 2 2 5.82 2 10.5c0 3.78 3.06 6.95 7.2 7.86.28.06.66.19.76.43.09.22.06.56.03.78l-.12.74c-.04.22-.17.88.77.48s5.1-3 6.96-5.15C19.63 13.4 22 11.2 22 10.5 22 5.82 17.52 2 12 2zm-2.5 11.5h-2v-5h2v5zm5 0h-2v-3l-1.5 2h-.02l-1.48-2v3h-2v-5h2l1.5 2 1.5-2h2v5z" />
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

// Export for direct import
export default LineLoginButton;
