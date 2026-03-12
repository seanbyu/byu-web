"use client";

import { useEffect, useCallback, memo } from "react";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { useAuthContext, useProfile } from "@/features/auth";
import Image from "next/image";
import { PageHeader } from "@/components/ui/PageHeader";
import { ChevronRight } from "lucide-react";

// ─── Loading Skeleton ─────────────────────────────────────

function LoadingSkeleton() {
  const t = useTranslations("auth");
  return (
    <div className="app-page-bleed bg-gray-50">
      <PageHeader title={t("myPage.title")} showBell showLanguage showHome={false} showSearch={false} showShare={false} />
      <div className="app-page-tight pt-4 space-y-4">
        <div className="h-24 animate-pulse rounded-2xl bg-gray-200" />
        <div className="h-28 animate-pulse rounded-2xl bg-gray-200" />
      </div>
    </div>
  );
}

// ─── Menu Row ─────────────────────────────────────────────

const MenuRow = memo(function MenuRow({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center justify-between px-4 py-4 text-left transition-colors hover:bg-gray-50 disabled:cursor-default disabled:opacity-50"
    >
      <span className="text-sm text-gray-800">{label}</span>
      {!disabled && <ChevronRight className="h-4 w-4 text-gray-400" />}
    </button>
  );
});

// ─── Section ──────────────────────────────────────────────

function MenuSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <p className="mb-1 px-1 text-xs font-semibold text-gray-500">{title}</p>
      <div className="divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-white">
        {children}
      </div>
    </section>
  );
}

// ─── Main Page ────────────────────────────────────────────

export default function MyPage() {
  const router = useRouter();
  const t = useTranslations("auth");
  const { user, isAuthenticated, isLoading: authLoading, signOut } = useAuthContext();

  const { profile, isLoading: profileLoading } = useProfile(
    isAuthenticated && !!user?.id
  );

  const handleLogout = useCallback(async () => {
    await signOut();
    router.replace("/");
  }, [signOut, router]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/");
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading || (isAuthenticated && profileLoading)) {
    return <LoadingSkeleton />;
  }

  if (!isAuthenticated || !user) {
    return null;
  }

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

  return (
    <div className="app-page-bleed bg-gray-50">
      <PageHeader title={t("myPage.title")} showBell showLanguage showHome={false} showSearch={false} showShare={false} />

      <div className="app-page-tight pt-4 space-y-5">
        {/* Profile Card */}
        <button
          type="button"
          onClick={() => router.push("/my-info")}
          className="flex w-full items-center gap-4 rounded-2xl border border-gray-100 bg-white px-4 py-4 text-left transition-colors hover:bg-gray-50"
          aria-label={t("myPage.editMember")}
        >
          <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-full border border-gray-100 bg-gray-200">
            {avatarUrl ? (
              <Image src={avatarUrl} alt={displayName} fill className="object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xl font-semibold text-gray-400">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-semibold text-gray-900">{displayName}</p>
            {email && <p className="truncate text-sm text-gray-500">{email}</p>}
          </div>
          <ChevronRight className="h-5 w-5 flex-shrink-0 text-gray-400" />
        </button>

        {/* 나의 정보관리 */}
        <MenuSection title={t("myPage.infoSection")}>
          <MenuRow
            label={t("myPage.editMember")}
            onClick={() => router.push("/my-info")}
          />
        </MenuSection>

        {/* 알림 */}
        <MenuSection title={t("myPage.notificationSection")}>
          <MenuRow
            label={t("myPage.notificationsTitle")}
            onClick={() => router.push("/notifications")}
          />
        </MenuSection>

        {/* 예약현황 */}
        <MenuSection title={t("myPage.bookingSection")}>
          <MenuRow label={t("myPage.comingSoon")} disabled />
        </MenuSection>

        {/* 고객센터 */}
        <MenuSection title={t("myPage.customerSection")}>
          <MenuRow label={t("myPage.announcements")} onClick={() => router.push("/announcements")} />
        </MenuSection>

        <div className="pt-1 pb-6">
          <button
            onClick={handleLogout}
            className="ds-control w-full rounded-xl border border-red-200 bg-white px-5 font-medium text-red-600 transition-colors hover:bg-red-50"
          >
            {t("logout")}
          </button>
        </div>
      </div>
    </div>
  );
}
