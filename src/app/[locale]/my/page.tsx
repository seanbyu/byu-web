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
            <div className="min-h-[100dvh] bg-white">
                <PageHeader showLanguage={true} showHome={true} showSearch={false} showShare={false} />
                <div className="mx-auto flex min-h-[calc(100dvh-3.5rem)] w-full max-w-6xl flex-col md:flex-row">
                    <aside className="border-b border-gray-200 bg-gray-50 p-3 md:min-h-[calc(100dvh-3.5rem)] md:w-56 md:border-b-0 md:border-r md:p-4">
                        <div className="grid grid-cols-3 gap-2 md:block md:space-y-2">
                            {[1, 2, 3].map((i) => (
                                <div
                                    key={i}
                                    className="h-11 w-full rounded-lg bg-gray-200 animate-pulse"
                                />
                            ))}
                        </div>
                    </aside>
                    <main className="flex-1 p-3 md:p-5">
                        <div className="mb-6 h-7 w-32 animate-pulse rounded bg-gray-200" />
                        <div className="space-y-4">
                            <div className="h-28 animate-pulse rounded bg-gray-200" />
                            <div className="h-28 animate-pulse rounded bg-gray-200" />
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
        <div className="min-h-[100dvh] bg-white">
            <PageHeader showLanguage={true} showHome={true} showSearch={false} showShare={false} />

            <div className="mx-auto flex min-h-[calc(100dvh-3.5rem)] w-full max-w-6xl flex-col md:flex-row">
                {/* Sidebar */}
                <aside className="border-b border-gray-200 bg-gray-50 p-2.5 md:min-h-[calc(100dvh-3.5rem)] md:w-56 md:border-b-0 md:border-r md:p-4">
                    <div className="grid grid-cols-3 gap-2 md:block md:space-y-1">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = activeTab === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id)}
                                    className={`flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg px-2 py-2 text-sm font-medium transition-colors md:justify-start md:px-3 ${
                                        isActive ? "bg-primary-600 text-white" : "text-gray-700 hover:bg-gray-100"
                                    }`}>
                                    <Icon className="h-[18px] w-[18px]" />
                                    <span className="truncate">{item.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-3 md:p-5">
                    {/* Account Tab */}
                    {activeTab === "account" && (
                        <div className="space-y-3 md:space-y-4">
                            <h1 className="text-lg font-bold text-gray-900">{t("myPage.account.title")}</h1>

                            {/* Profile Card */}
                            <div className="rounded-xl border border-gray-200 bg-white p-3">
                                <h2 className="mb-3 text-sm font-semibold text-gray-600">{t("myPage.account.basicInfo")}</h2>
                                <div className="mb-3 flex items-center gap-3">
                                    <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-full bg-gray-200">
                                        {avatarUrl ? (
                                            <Image src={avatarUrl} alt={displayName} fill className="object-cover" />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-2xl text-gray-400">
                                                {displayName.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="truncate text-base font-semibold text-gray-900">{displayName}</p>
                                        <p className="truncate text-sm text-gray-500">{email}</p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="grid grid-cols-[88px_1fr] items-start gap-2">
                                        <p className="pt-1 text-sm text-gray-500">{t("myPage.account.name")}</p>
                                        <p className="text-base text-gray-900">{displayName}</p>
                                    </div>
                                    <div className="grid grid-cols-[88px_1fr] items-start gap-2">
                                        <p className="pt-1 text-sm text-gray-500">{t("myPage.account.email")}</p>
                                        <p className="break-all text-base text-gray-900">{email || "-"}</p>
                                    </div>
                                    <div className="grid grid-cols-[88px_1fr] items-start gap-2">
                                        <p className="pt-1 text-sm text-gray-500">{t("myPage.userId")}</p>
                                        <p className="break-all font-mono text-sm text-gray-900">{user.id}</p>
                                    </div>
                                </div>
                            </div>

                            {/* LINE Info Card */}
                            {isLineUser && (
                                <div className="rounded-xl border border-gray-200 bg-white p-3">
                                    <div className="mb-3 flex items-center gap-2">
                                        <svg className="h-4 w-4 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 2C6.48 2 2 5.82 2 10.5c0 3.78 3.06 6.95 7.2 7.86.28.06.66.19.76.43.09.22.06.56.03.78l-.12.74c-.04.22-.17.88.77.48s5.1-3 6.96-5.15C19.63 13.4 22 11.2 22 10.5 22 5.82 17.52 2 12 2z" />
                                        </svg>
                                        <h2 className="text-sm font-semibold text-gray-600">{t("myPage.account.lineInfo")}</h2>
                                    </div>
                                    <div className="space-y-3">
                                        {lineDisplayName && (
                                            <div>
                                                <p className="mb-1 text-sm text-gray-500">
                                                    {t("myPage.account.lineDisplayName")}
                                                </p>
                                                <p className="text-base text-gray-900">{lineDisplayName}</p>
                                            </div>
                                        )}
                                        {lineUserId && (
                                            <div>
                                                <p className="mb-1 text-sm text-gray-500">{t("myPage.account.lineUserId")}</p>
                                                <p className="break-all font-mono text-sm text-gray-900">{lineUserId}</p>
                                            </div>
                                        )}
                                        <div className="pt-2">
                                            <span className="inline-flex min-h-[32px] items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                                                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
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
                                <div className="rounded-xl border border-gray-200 bg-white p-3">
                                    <h2 className="mb-3 text-sm font-semibold text-gray-600">{t("myPage.connectedAccounts")}</h2>
                                    <div className="flex flex-wrap gap-2">
                                        {profileData.user_identities.map((identity) => (
                                            <span
                                                key={identity.id}
                                                className={`inline-flex min-h-[36px] items-center rounded-lg border px-3 py-2 text-sm font-medium ${
                                                    identity.is_primary
                                                        ? "border-green-200 bg-green-100 text-green-700"
                                                        : "border-gray-200 bg-gray-100 text-gray-700"
                                                }`}>
                                                {identity.provider}
                                                {identity.is_primary && <span className="ml-1 text-sm">(Primary)</span>}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Logout Button */}
                            <div className="pt-2 md:pt-4">
                                <button
                                    onClick={handleLogout}
                                    className="min-h-[44px] w-full rounded-xl bg-red-50 px-5 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-100">
                                    {t("logout")}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Notifications Tab */}
                    {activeTab === "notifications" && (
                        <div className="space-y-3 md:space-y-4">
                            <h1 className="text-lg font-bold text-gray-900">{t("myPage.menu.notifications")}</h1>
                            <div className="rounded-xl border border-gray-200 bg-white p-6 text-center md:p-8">
                                <Bell className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                                <p className="text-sm text-gray-500 md:text-base">알림 기능은 준비 중입니다.</p>
                            </div>
                        </div>
                    )}

                    {/* Bookings Tab */}
                    {activeTab === "bookings" && (
                        <div className="space-y-3 md:space-y-4">
                            <h1 className="text-lg font-bold text-gray-900">{t("myPage.menu.bookings")}</h1>
                            <div className="rounded-xl border border-gray-200 bg-white p-6 text-center md:p-8">
                                <Calendar className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                                <p className="text-sm text-gray-500 md:text-base">예약 현황 기능은 준비 중입니다.</p>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
