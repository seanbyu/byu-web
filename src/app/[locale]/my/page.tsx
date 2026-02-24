"use client";

import { useEffect, useState, useCallback, memo } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuthContext, useProfile } from "@/features/auth";
import type { UserProfile } from "@/features/auth";
import Image from "next/image";
import { PageHeader } from "@/components/ui/PageHeader";
import { User, Bell, Calendar, Copy, Check } from "lucide-react";

type TabType = "account" | "notifications" | "bookings";

// ─── Hoisted static config (rendering-hoist-jsx) ─────────

const TAB_CONFIG: { id: TabType; icon: typeof User }[] = [
    { id: "account", icon: User },
    { id: "notifications", icon: Bell },
    { id: "bookings", icon: Calendar },
];

// ─── Extracted: Copy Button (rerender-memo) ──────────────

const CopyButton = memo(function CopyButton({
    value,
    fieldKey,
    copiedField,
    onCopy,
}: {
    value: string;
    fieldKey: string;
    copiedField: string | null;
    onCopy: (value: string, key: string) => void;
}) {
    const isCopied = copiedField === fieldKey;
    return (
        <button
            onClick={() => onCopy(value, fieldKey)}
            className="inline-flex min-h-[40px] items-center justify-center gap-1 rounded-lg border border-gray-200 px-2.5 text-sm text-gray-600 transition-colors hover:bg-gray-100 sm:min-h-[36px]"
            aria-label={`Copy ${fieldKey}`}
        >
            {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            <span className="text-xs">{isCopied ? "복사됨" : "복사"}</span>
        </button>
    );
});

// ─── Extracted: Account Tab (rerender-memo) ──────────────

const AccountTab = memo(function AccountTab({
    profile,
    user,
    phoneInput,
    setPhoneInput,
    isSavingPhone,
    phoneSaveStatus,
    onSavePhone,
    copiedField,
    onCopy,
    onLogout,
}: {
    profile: UserProfile | null;
    user: { id: string; email?: string; user_metadata?: Record<string, unknown> };
    phoneInput: string;
    setPhoneInput: (v: string) => void;
    isSavingPhone: boolean;
    phoneSaveStatus: "success" | "error" | null;
    onSavePhone: () => void;
    copiedField: string | null;
    onCopy: (value: string, key: string) => void;
    onLogout: () => void;
}) {
    const t = useTranslations("auth");
    const metadata = user.user_metadata || {};

    const primaryIdentity =
        profile?.user_identities?.find((i) => i.is_primary) ||
        profile?.user_identities?.find((i) => i.provider === "LINE") ||
        profile?.user_identities?.[0];

    const displayName =
        profile?.name ||
        primaryIdentity?.profile?.displayName ||
        (metadata.full_name as string) ||
        (metadata.name as string) ||
        "User";
    const avatarUrl =
        profile?.profile_image ||
        primaryIdentity?.profile?.pictureUrl ||
        (metadata.avatar_url as string) ||
        (metadata.picture as string);
    const email = profile?.email || user.email || "";
    const lineUserId =
        primaryIdentity?.provider_user_id ||
        primaryIdentity?.profile?.lineUserId ||
        (metadata.line_user_id as string) ||
        "";
    const lineDisplayName = primaryIdentity?.profile?.displayName;
    const isLineUser = primaryIdentity?.provider === "LINE" || metadata.provider === "line";
    const savedPhone = profile?.phone || (typeof metadata.phone === "string" ? metadata.phone : "");
    const isPhoneChanged = phoneInput.trim() !== (savedPhone || "").trim();

    return (
        <div className="space-y-6">
            <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
                {t("myPage.account.title")}
            </h1>

            {/* Profile Hero */}
            <section className="overflow-hidden rounded-2xl border border-primary-200 bg-gradient-to-br from-primary-50 via-white to-secondary-50">
                <div className="p-4 sm:p-5 md:p-6">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-full border-2 border-white bg-gray-200 shadow-sm sm:h-20 sm:w-20">
                            {avatarUrl ? (
                                <Image src={avatarUrl} alt={displayName} fill className="object-cover" />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-gray-400 sm:text-3xl">
                                    {displayName.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                        <div className="min-w-0">
                            <p className="truncate text-lg font-semibold text-gray-900 sm:text-xl">{displayName}</p>
                            <p className="truncate text-sm text-gray-600">{email || "-"}</p>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                                {isLineUser ? (
                                    <span className="inline-flex min-h-[28px] items-center rounded-full border border-line-200 bg-line-100 px-2.5 py-1 text-xs font-medium text-line-700 sm:min-h-[30px] sm:px-3 sm:text-sm">
                                        {t("myPage.lineConnected")}
                                    </span>
                                ) : null}
                                {profile?.user_identities?.some((identity) => identity.is_primary) ? (
                                    <span className="inline-flex min-h-[28px] items-center rounded-full border border-primary-200 bg-primary-100 px-2.5 py-1 text-xs font-medium text-primary-700 sm:min-h-[30px] sm:px-3 sm:text-sm">
                                        대표 계정
                                    </span>
                                ) : null}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Basic Info */}
            <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 md:p-6">
                <h2 className="mb-4 text-sm font-semibold text-gray-900 sm:text-base">
                    {t("myPage.account.basicInfo")}
                </h2>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-[120px_1fr_auto] sm:items-center sm:gap-3">
                        <p className="text-xs text-gray-500 sm:text-sm">{t("myPage.account.name")}</p>
                        <p className="break-all text-base text-gray-900">{displayName}</p>
                        <div />
                    </div>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-[120px_1fr_auto] sm:items-center sm:gap-3">
                        <label htmlFor="user-phone" className="text-xs text-gray-500 sm:text-sm">
                            {t("myPage.account.phone")}
                        </label>
                        <input
                            id="user-phone"
                            type="tel"
                            value={phoneInput}
                            onChange={(e) => setPhoneInput(e.target.value)}
                            placeholder={t("myPage.account.phonePlaceholder")}
                            className="ds-input py-2.5"
                        />
                        <button
                            onClick={onSavePhone}
                            disabled={isSavingPhone || !isPhoneChanged}
                            className="inline-flex min-h-[44px] w-full items-center justify-center rounded-lg bg-primary-600 px-3 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-gray-300 sm:min-h-[40px] sm:w-auto"
                        >
                            {isSavingPhone ? t("myPage.account.saving") : t("myPage.account.save")}
                        </button>
                    </div>
                    {phoneSaveStatus === "success" ? (
                        <p className="text-sm text-line-700">{t("myPage.account.phoneSaved")}</p>
                    ) : phoneSaveStatus === "error" ? (
                        <p className="text-sm text-red-600">{t("myPage.account.phoneSaveFailed")}</p>
                    ) : null}
                    <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-[120px_1fr_auto] sm:items-center sm:gap-3">
                        <p className="text-xs text-gray-500 sm:text-sm">{t("myPage.account.email")}</p>
                        <p className="break-all text-base text-gray-900">{email || "-"}</p>
                        <CopyButton value={email} fieldKey="email" copiedField={copiedField} onCopy={onCopy} />
                    </div>
                    <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-[120px_1fr_auto] sm:items-center sm:gap-3">
                        <p className="text-xs text-gray-500 sm:text-sm">{t("myPage.userId")}</p>
                        <p className="break-all font-mono text-xs text-gray-900 sm:text-sm">{user.id}</p>
                        <CopyButton value={user.id} fieldKey="uid" copiedField={copiedField} onCopy={onCopy} />
                    </div>
                </div>
            </section>

            {/* LINE Info Card */}
            {isLineUser ? (
                <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 md:p-6">
                    <h2 className="mb-4 text-sm font-semibold text-gray-900 sm:text-base">
                        {t("myPage.account.lineInfo")}
                    </h2>
                    <div className="space-y-4">
                        {lineDisplayName ? (
                            <div>
                                <p className="mb-1 text-xs text-gray-500 sm:text-sm">
                                    {t("myPage.account.lineDisplayName")}
                                </p>
                                <p className="text-base text-gray-900">{lineDisplayName}</p>
                            </div>
                        ) : null}
                        {lineUserId ? (
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
                                <div>
                                    <p className="mb-1 text-xs text-gray-500 sm:text-sm">
                                        {t("myPage.account.lineUserId")}
                                    </p>
                                    <p className="break-all font-mono text-xs text-gray-900 sm:text-sm">
                                        {lineUserId}
                                    </p>
                                </div>
                                <CopyButton
                                    value={lineUserId}
                                    fieldKey="line-id"
                                    copiedField={copiedField}
                                    onCopy={onCopy}
                                />
                            </div>
                        ) : null}
                    </div>
                </section>
            ) : null}

            {/* Connected Accounts */}
            {profile?.user_identities && profile.user_identities.length > 0 ? (
                <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 md:p-6">
                    <h2 className="mb-4 text-sm font-semibold text-gray-900 sm:text-base">
                        {t("myPage.connectedAccounts")}
                    </h2>
                    <div className="flex flex-wrap gap-2.5">
                        {profile.user_identities.map((identity) => (
                            <span
                                key={identity.id}
                                className={`inline-flex min-h-[36px] items-center rounded-lg border px-3 py-2 text-sm font-medium ${
                                    identity.is_primary
                                        ? "border-line-200 bg-line-100 text-line-700"
                                        : "border-gray-200 bg-gray-100 text-gray-700"
                                }`}
                            >
                                {identity.provider}
                                {identity.is_primary ? <span className="ml-1 text-sm">(Primary)</span> : null}
                            </span>
                        ))}
                    </div>
                </section>
            ) : null}

            {/* Logout Button */}
            <div className="pt-1 md:pt-2">
                <button
                    onClick={onLogout}
                    className="min-h-[44px] w-full rounded-xl border border-red-200 bg-white px-5 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                >
                    {t("logout")}
                </button>
            </div>
        </div>
    );
});

// ─── Extracted: Placeholder Tabs (rerender-memo) ─────────

const NotificationsTab = memo(function NotificationsTab() {
    const t = useTranslations("auth");
    return (
        <div className="space-y-3 md:space-y-4">
            <h1 className="text-base font-bold text-gray-900 sm:text-lg">{t("myPage.menu.notifications")}</h1>
            <div className="rounded-xl border border-gray-200 bg-white p-6 text-center md:p-8">
                <Bell className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                <p className="text-sm text-gray-500 md:text-base">알림 기능은 준비 중입니다.</p>
            </div>
        </div>
    );
});

const BookingsTab = memo(function BookingsTab() {
    const t = useTranslations("auth");
    return (
        <div className="space-y-3 md:space-y-4">
            <h1 className="text-base font-bold text-gray-900 sm:text-lg">{t("myPage.menu.bookings")}</h1>
            <div className="rounded-xl border border-gray-200 bg-white p-6 text-center md:p-8">
                <Calendar className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                <p className="text-sm text-gray-500 md:text-base">예약 현황 기능은 준비 중입니다.</p>
            </div>
        </div>
    );
});

// ─── Loading Skeleton (rendering-hoist-jsx) ──────────────

function LoadingSkeleton() {
    return (
        <div className="app-page-bleed bg-gray-50">
            <PageHeader showLanguage showHome showSearch={false} showShare={false} />
            <div className="app-page-tight pt-2">
                <div className="mb-4 rounded-xl border border-gray-200 bg-white p-1 sm:mb-5">
                    <div className="grid grid-cols-3 gap-1">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-10 w-full rounded-lg bg-gray-200 animate-pulse sm:h-11" />
                        ))}
                    </div>
                </div>
                <div className="mb-6 h-7 w-32 animate-pulse rounded bg-gray-200" />
                <div className="space-y-6">
                    <div className="h-36 animate-pulse rounded-2xl bg-gray-200" />
                    <div className="h-40 animate-pulse rounded-2xl bg-gray-200" />
                    <div className="h-36 animate-pulse rounded-2xl bg-gray-200" />
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ───────────────────────────────────────────

export default function MyPage() {
    const router = useRouter();
    const t = useTranslations("auth");
    const { user, isAuthenticated, isLoading: authLoading, signOut } = useAuthContext();

    const [activeTab, setActiveTab] = useState<TabType>("account");
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [phoneInput, setPhoneInput] = useState("");
    const [phoneSaveStatus, setPhoneSaveStatus] = useState<"success" | "error" | null>(null);

    // SWR for profile data (client-swr-dedup)
    const { profile, isLoading: profileLoading, savePhone, isSavingPhone } = useProfile(
        isAuthenticated && !!user?.id
    );

    // Redirect unauthenticated (js-early-exit)
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.replace("/");
        }
    }, [authLoading, isAuthenticated, router]);

    // Sync phone input from profile (rerender-dependencies: narrow deps)
    useEffect(() => {
        const metadataPhone = typeof user?.user_metadata?.phone === "string" ? user.user_metadata.phone : "";
        const profilePhone = profile?.phone ?? "";
        setPhoneInput(profilePhone || metadataPhone || "");
    }, [profile?.phone, user?.user_metadata?.phone]);

    // Auto-clear save status (rerender-dependencies)
    useEffect(() => {
        if (!phoneSaveStatus) return;
        const timer = setTimeout(() => setPhoneSaveStatus(null), 1800);
        return () => clearTimeout(timer);
    }, [phoneSaveStatus]);

    const handleLogout = useCallback(async () => {
        await signOut();
        router.replace("/");
    }, [signOut, router]);

    // rerender-functional-setstate: functional update for timeout race safety
    const handleCopy = useCallback(async (value: string, key: string) => {
        if (!value) return;
        try {
            await navigator.clipboard.writeText(value);
            setCopiedField(key);
            setTimeout(() => setCopiedField((prev) => (prev === key ? null : prev)), 1400);
        } catch {
            // clipboard not available
        }
    }, []);

    const handleSavePhone = useCallback(async () => {
        setPhoneSaveStatus(null);
        try {
            await savePhone({ phone: phoneInput });
            setPhoneSaveStatus("success");
        } catch {
            setPhoneSaveStatus("error");
        }
    }, [savePhone, phoneInput]);

    // Loading states (js-early-exit)
    if (authLoading || (isAuthenticated && profileLoading)) {
        return <LoadingSkeleton />;
    }

    if (!isAuthenticated || !user) {
        return null;
    }

    return (
        <div className="app-page-bleed bg-gray-50">
            <PageHeader showLanguage showHome showSearch={false} showShare={false} />

            <div className="app-page-tight pt-2">
                {/* Tab Navigation */}
                <div className="mb-4 rounded-xl border border-gray-200 bg-white p-1 sm:mb-5">
                    <div className="grid grid-cols-3 gap-1">
                        {TAB_CONFIG.map((item) => {
                            const Icon = item.icon;
                            const isActive = activeTab === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id)}
                                    className={`flex min-h-[42px] items-center justify-center gap-1 rounded-lg px-1.5 py-2 text-[11px] font-medium transition-colors sm:min-h-[44px] sm:gap-2 sm:px-2 sm:text-sm ${
                                        isActive
                                            ? "bg-primary-600 text-white shadow-sm"
                                            : "text-gray-700 hover:bg-gray-100"
                                    }`}
                                >
                                    <Icon className="hidden h-4 w-4 sm:block sm:h-[18px] sm:w-[18px]" />
                                    <span className="truncate whitespace-nowrap">
                                        {t(`myPage.menu.${item.id}`)}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Tab Content (rendering-conditional-render: explicit ternary) */}
                <main>
                    {activeTab === "account" ? (
                        <AccountTab
                            profile={profile}
                            user={user}
                            phoneInput={phoneInput}
                            setPhoneInput={setPhoneInput}
                            isSavingPhone={isSavingPhone}
                            phoneSaveStatus={phoneSaveStatus}
                            onSavePhone={handleSavePhone}
                            copiedField={copiedField}
                            onCopy={handleCopy}
                            onLogout={handleLogout}
                        />
                    ) : activeTab === "notifications" ? (
                        <NotificationsTab />
                    ) : (
                        <BookingsTab />
                    )}
                </main>
            </div>
        </div>
    );
}
