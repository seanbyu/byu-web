"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuthContext } from "@/features/auth";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import { PageHeader } from "@/components/ui/PageHeader";
import type { User as PublicUser } from "@/lib/supabase/types";

// Type for user identity (LINE, Google, Kakao, etc.)
interface UserIdentity {
  id: string;
  provider: string;
  provider_user_id: string | null;
  profile: {
    displayName?: string;
    pictureUrl?: string;
    statusMessage?: string;
    lineUserId?: string;
  } | null;
  is_primary: boolean;
}

type UserWithIdentities = PublicUser & {
  user_identities: UserIdentity[];
};

export default function MyPage() {
  const router = useRouter();
  const t = useTranslations("auth");
  const { user, session, isAuthenticated, isLoading: authLoading, signOut } = useAuthContext();
  const [profileData, setProfileData] = useState<UserWithIdentities | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Fetch user profile from public.users and user_identities
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const supabase = createClient();

      // Fetch user with their linked identities
      const userResult = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      // Fetch user identities (LINE, Google, Kakao, etc.)
      // Using type assertion since user_identities table types may not be regenerated
      const identitiesResult = await (supabase
        .from("user_identities" as any)
        .select("id, provider, provider_user_id, profile, is_primary")
        .eq("user_id", userId)
        .order("is_primary", { ascending: false })) as unknown as { data: UserIdentity[] | null };

      if (userResult.data) {
        setProfileData({
          ...userResult.data,
          user_identities: identitiesResult.data || [],
        } as UserWithIdentities);
      }
    } catch (error) {
      console.error("Profile fetch error:", error);
    }
  }, []);

  // Initialize and fetch profile
  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      router.replace("/");
      return;
    }

    if (user?.id && !isInitialized) {
      fetchProfile(user.id).finally(() => {
        setIsInitialized(true);
      });
    }
  }, [authLoading, isAuthenticated, user?.id, router, fetchProfile, isInitialized]);

  const handleLogout = async () => {
    await signOut();
    router.replace("/");
  };

  // Show nothing while checking auth (prevents flash)
  if (authLoading || (!isInitialized && isAuthenticated)) {
    return (
      <div className="bg-white">
        {/* Header Skeleton */}
        <header className="bg-white border-b border-gray-100">
          <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
            <div className="w-8 h-8" />
            <div className="flex items-center gap-4">
              <div className="w-6 h-6 bg-gray-200 rounded animate-pulse" />
              <div className="w-6 h-6 bg-gray-200 rounded animate-pulse" />
              <div className="w-6 h-6 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </header>
        {/* Content Skeleton */}
        <main className="max-w-md mx-auto px-4 py-6 space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gray-200" />
              <div className="flex-1 space-y-2">
                <div className="h-5 bg-gray-200 rounded w-24" />
                <div className="h-4 bg-gray-200 rounded w-40" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm divide-y divide-gray-100 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="px-4 py-3 space-y-1">
                <div className="h-3 bg-gray-200 rounded w-16" />
                <div className="h-4 bg-gray-200 rounded w-24" />
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  // Use data from public.users and user_identities, fallback to auth metadata
  const metadata = user.user_metadata || {};

  // Find primary identity (or first LINE identity)
  const primaryIdentity = profileData?.user_identities?.find(i => i.is_primary)
    || profileData?.user_identities?.find(i => i.provider === "LINE")
    || profileData?.user_identities?.[0];

  const displayName = profileData?.name || primaryIdentity?.profile?.displayName || metadata.full_name || metadata.name || "LINE User";
  const avatarUrl = profileData?.profile_image || primaryIdentity?.profile?.pictureUrl || metadata.avatar_url || metadata.picture;
  const email = profileData?.email || user.email || "";
  const lineUserId = primaryIdentity?.provider_user_id || primaryIdentity?.profile?.lineUserId || metadata.line_user_id || "";
  const lineDisplayName = primaryIdentity?.profile?.displayName;
  const isLineUser = primaryIdentity?.provider === "LINE" || metadata.provider === "line";

  return (
    <div className="bg-white">
      {/* Header */}
      <PageHeader />

      {/* Profile Section */}
      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Page Title */}
        <h1 className="text-xl font-bold text-gray-900">{t("myPage.title")}</h1>

        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={displayName}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl text-gray-400">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-semibold text-gray-900 truncate">{displayName}</h2>
              {lineDisplayName && lineDisplayName !== displayName && (
                <p className="text-sm text-gray-500 truncate">LINE: {lineDisplayName}</p>
              )}
              <p className="text-sm text-gray-500 truncate">{email}</p>
            </div>
          </div>

          {/* LINE Badge */}
          {isLineUser && (
            <div className="mt-4 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 5.82 2 10.5c0 3.78 3.06 6.95 7.2 7.86.28.06.66.19.76.43.09.22.06.56.03.78l-.12.74c-.04.22-.17.88.77.48s5.1-3 6.96-5.15C19.63 13.4 22 11.2 22 10.5 22 5.82 17.52 2 12 2z" />
                </svg>
                {t("myPage.lineConnected")}
              </span>
            </div>
          )}
        </div>

        {/* Account Info */}
        <div className="bg-white rounded-xl shadow-sm divide-y divide-gray-100">
          <div className="px-4 py-3">
            <p className="text-xs text-gray-500">{t("myPage.userId")}</p>
            <p className="text-sm text-gray-900 font-mono">{user.id.slice(0, 8)}...</p>
          </div>
          {lineUserId && (
            <div className="px-4 py-3">
              <p className="text-xs text-gray-500">{t("myPage.lineId")}</p>
              <p className="text-sm text-gray-900 font-mono">{lineUserId.slice(0, 8)}...</p>
            </div>
          )}
          {/* Connected Social Accounts */}
          {profileData?.user_identities && profileData.user_identities.length > 0 && (
            <div className="px-4 py-3">
              <p className="text-xs text-gray-500">{t("myPage.connectedAccounts") || "Connected Accounts"}</p>
              <div className="flex gap-2 mt-1">
                {profileData.user_identities.map((identity) => (
                  <span
                    key={identity.id}
                    className={`text-xs px-2 py-1 rounded-full ${
                      identity.is_primary ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {identity.provider}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div className="px-4 py-3">
            <p className="text-xs text-gray-500">{t("myPage.loginStatus")}</p>
            <p className="text-sm text-green-600 font-medium">{t("myPage.loggedIn")}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleLogout}
            className="w-full px-4 py-3 bg-red-50 text-red-600 font-medium rounded-xl hover:bg-red-100 transition-colors"
          >
            {t("logout")}
          </button>
        </div>

        {/* Debug Info (development only) */}
        {process.env.NODE_ENV === "development" && (
          <details className="bg-gray-100 rounded-xl p-4">
            <summary className="text-sm font-medium text-gray-600 cursor-pointer">
              {t("myPage.debugInfo")}
            </summary>
            <pre className="mt-2 text-xs text-gray-500 overflow-auto">
              {JSON.stringify({
                authUser: user,
                session: !!session,
                publicUser: profileData,
              }, null, 2)}
            </pre>
          </details>
        )}
      </main>
    </div>
  );
}
