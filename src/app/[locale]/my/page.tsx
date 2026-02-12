"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuthContext } from "@/features/auth";
import Image from "next/image";
import { PageHeader } from "@/components/ui/PageHeader";
import { User, Bell, Calendar } from "lucide-react";
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

type TabType = "account" | "notifications" | "bookings";

export default function MyPage() {
    const router = useRouter();
    const t = useTranslations("auth");
    const { user, isAuthenticated, isLoading: authLoading, signOut } = useAuthContext();
    const [profileData, setProfileData] = useState<UserWithIdentities | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>("account");

    // Fetch user profile via API
    const fetchProfile = useCallback(async () => {
        try {
            const response = await fetch("/api/users/me");
            const result = await response.json();

            if (result.success && result.data) {
                setProfileData(result.data as UserWithIdentities);
            } else {
                console.error("Profile fetch failed:", result.message);
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
            fetchProfile().finally(() => {
                setIsInitialized(true);
            });
        }
    }, [authLoading, isAuthenticated, user?.id, router, fetchProfile, isInitialized]);

    const handleLogout = async () => {
        await signOut();
        router.replace("/");
    };

    // Show loading skeleton
    if (authLoading || (!isInitialized && isAuthenticated)) {
        return (
            <div className="bg-white min-h-screen">
                <PageHeader
                    showLanguage={true}
                    showHome={true}
                    showSearch={false}
                    showShare={false}
                />
                <div className="flex max-w-6xl mx-auto">
                    <aside className="w-48 border-r border-gray-200 min-h-screen p-4 space-y-2">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-10 bg-gray-200 rounded animate-pulse" />
                        ))}
                    </aside>
                    <main className="flex-1 p-6">
                        <div className="h-6 bg-gray-200 rounded w-32 mb-6 animate-pulse" />
                        <div className="space-y-4">
                            <div className="h-24 bg-gray-200 rounded animate-pulse" />
                            <div className="h-24 bg-gray-200 rounded animate-pulse" />
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    if (!isAuthenticated || !user) {
        return null;
    }

    // Use data from public.users and user_identities, fallback to auth metadata
    const metadata = user.user_metadata || {};

    // Find primary identity (or first LINE identity)
    const primaryIdentity =
        profileData?.user_identities?.find((i) => i.is_primary) ||
        profileData?.user_identities?.find((i) => i.provider === "LINE") ||
        profileData?.user_identities?.[0];

    const displayName =
        profileData?.name ||
        primaryIdentity?.profile?.displayName ||
        metadata.full_name ||
        metadata.name ||
        "User";
    const avatarUrl =
        profileData?.profile_image || primaryIdentity?.profile?.pictureUrl || metadata.avatar_url || metadata.picture;
    const email = profileData?.email || user.email || "";
    const lineUserId =
        primaryIdentity?.provider_user_id || primaryIdentity?.profile?.lineUserId || metadata.line_user_id || "";
    const lineDisplayName = primaryIdentity?.profile?.displayName;
    const isLineUser = primaryIdentity?.provider === "LINE" || metadata.provider === "line";

    const menuItems: { id: TabType; icon: typeof User; label: string }[] = [
        { id: "account", icon: User, label: t("myPage.menu.account") },
        { id: "notifications", icon: Bell, label: t("myPage.menu.notifications") },
        { id: "bookings", icon: Calendar, label: t("myPage.menu.bookings") },
    ];

    return (
        <div className="bg-white min-h-screen">
            <PageHeader
                showLanguage={true}
                showHome={true}
                showSearch={false}
                showShare={false}
            />

            <div className="flex max-w-6xl mx-auto">
                {/* Sidebar */}
                <aside className="w-48 border-r border-gray-200 min-h-screen bg-gray-50">
                    <div className="p-4 space-y-1">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = activeTab === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id)}
                                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                                        isActive
                                            ? "bg-primary-600 text-white"
                                            : "text-gray-700 hover:bg-gray-100"
                                    }`}>
                                    <Icon className="w-4 h-4" />
                                    {item.label}
                                </button>
                            );
                        })}
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-6">
                    {/* Account Tab */}
                    {activeTab === "account" && (
                        <div className="space-y-6">
                            <h1 className="text-lg font-bold text-gray-900">{t("myPage.account.title")}</h1>

                            {/* Profile Card */}
                            <div className="bg-white rounded-xl border border-gray-200 p-4">
                                <h2 className="text-sm font-semibold text-gray-600 mb-4">
                                    {t("myPage.account.basicInfo")}
                                </h2>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                                        {avatarUrl ? (
                                            <Image src={avatarUrl} alt={displayName} fill className="object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-2xl text-gray-400">
                                                {displayName.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-base font-semibold text-gray-900">{displayName}</p>
                                        <p className="text-xs text-gray-500">{email}</p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">{t("myPage.account.name")}</p>
                                        <p className="text-sm text-gray-900">{displayName}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">{t("myPage.account.email")}</p>
                                        <p className="text-sm text-gray-900 break-all">{email || "-"}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">{t("myPage.userId")}</p>
                                        <p className="text-xs text-gray-900 font-mono break-all">{user.id}</p>
                                    </div>
                                </div>
                            </div>

                            {/* LINE Info Card */}
                            {isLineUser && (
                                <div className="bg-white rounded-xl border border-gray-200 p-4">
                                    <div className="flex items-center gap-2 mb-4">
                                        <svg className="w-4 h-4 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 2C6.48 2 2 5.82 2 10.5c0 3.78 3.06 6.95 7.2 7.86.28.06.66.19.76.43.09.22.06.56.03.78l-.12.74c-.04.22-.17.88.77.48s5.1-3 6.96-5.15C19.63 13.4 22 11.2 22 10.5 22 5.82 17.52 2 12 2z" />
                                        </svg>
                                        <h2 className="text-sm font-semibold text-gray-600">
                                            {t("myPage.account.lineInfo")}
                                        </h2>
                                    </div>
                                    <div className="space-y-3">
                                        {lineDisplayName && (
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">
                                                    {t("myPage.account.lineDisplayName")}
                                                </p>
                                                <p className="text-sm text-gray-900">{lineDisplayName}</p>
                                            </div>
                                        )}
                                        {lineUserId && (
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">
                                                    {t("myPage.account.lineUserId")}
                                                </p>
                                                <p className="text-xs text-gray-900 font-mono break-all">{lineUserId}</p>
                                            </div>
                                        )}
                                        <div className="pt-2">
                                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                                                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                                </svg>
                                                {t("myPage.lineConnected")}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Connected Accounts */}
                            {profileData?.user_identities && profileData.user_identities.length > 0 && (
                                <div className="bg-white rounded-xl border border-gray-200 p-4">
                                    <h2 className="text-sm font-semibold text-gray-600 mb-4">
                                        {t("myPage.connectedAccounts")}
                                    </h2>
                                    <div className="flex flex-wrap gap-2">
                                        {profileData.user_identities.map((identity) => (
                                            <span
                                                key={identity.id}
                                                className={`text-sm px-3 py-1.5 rounded-lg font-medium ${
                                                    identity.is_primary
                                                        ? "bg-green-100 text-green-700 border border-green-200"
                                                        : "bg-gray-100 text-gray-700 border border-gray-200"
                                                }`}>
                                                {identity.provider}
                                                {identity.is_primary && (
                                                    <span className="ml-1 text-xs">(Primary)</span>
                                                )}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Logout Button */}
                            <div className="pt-4">
                                <button
                                    onClick={handleLogout}
                                    className="px-5 py-2.5 bg-red-50 text-red-600 text-sm font-medium rounded-xl hover:bg-red-100 transition-colors">
                                    {t("logout")}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Notifications Tab */}
                    {activeTab === "notifications" && (
                        <div className="space-y-6">
                            <h1 className="text-lg font-bold text-gray-900">{t("myPage.menu.notifications")}</h1>
                            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500">알림 기능은 준비 중입니다.</p>
                            </div>
                        </div>
                    )}

                    {/* Bookings Tab */}
                    {activeTab === "bookings" && (
                        <div className="space-y-6">
                            <h1 className="text-lg font-bold text-gray-900">{t("myPage.menu.bookings")}</h1>
                            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500">예약 현황 기능은 준비 중입니다.</p>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
