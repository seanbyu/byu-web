"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LineLoginButton, useAuthContext } from "@/features/auth";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gray-50">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo / Title */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Salon Web</h1>
          <p className="mt-2 text-sm text-gray-600">
            LINEアカウントでログインしてください
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
              LINEアプリ内でご利用いただいています
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
        <p className="text-center text-xs text-gray-500">
          ログインすることで、利用規約とプライバシーポリシーに同意したことになります。
        </p>
      </div>
    </div>
  );
}
