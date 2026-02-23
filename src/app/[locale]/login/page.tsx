"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { LineLoginButton, useAuthContext } from "@/features/auth";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("auth");
  const { isAuthenticated, isLoading, error, liff, environment } =
    useAuthContext();

  const errorMessage = searchParams.get("error");

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.push("/");
    }
  }, [isAuthenticated, isLoading, router]);

  // Auto-authenticate in LIFF environment if already logged in to LINE
  useEffect(() => {
    if (
      environment === "liff" &&
      liff.isLoggedIn &&
      liff.idToken &&
      !isAuthenticated
    ) {
      // Auto-trigger authentication
    }
  }, [environment, liff, isAuthenticated]);

  const handleLoginSuccess = () => {
    router.push("/");
  };

  const handleLoginError = (error: string) => {
    console.error("Login error:", error);
  };

  if (isLoading) {
    return (
      <div className="app-page-tight flex min-h-[60vh] items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500" />
      </div>
    );
  }

  return (
    <div className="app-page-tight flex min-h-[calc(100dvh-3.5rem)] flex-col items-center justify-center bg-white">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo / Title */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Salon Web</h1>
          <p className="mt-2 text-sm text-gray-600">
            {t("loginRequiredDesc")}
          </p>
        </div>

        {/* Error Message */}
        {(errorMessage || error) && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-600">
              {errorMessage || error?.message}
            </p>
          </div>
        )}

        {/* LIFF Environment Notice */}
        {environment === "liff" && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-700">
              {t("lineAppWillOpen")}
            </p>
          </div>
        )}

        {/* Login Button */}
        <div className="space-y-4">
          <LineLoginButton
            onSuccess={handleLoginSuccess}
            onError={handleLoginError}
          />
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500">
          {t.rich("termsNotice", {
            terms: (chunks) => <a href="/terms" className="underline">{chunks}</a>,
            privacy: (chunks) => <a href="/privacy" className="underline">{chunks}</a>,
          })}
        </p>
      </div>
    </div>
  );
}
