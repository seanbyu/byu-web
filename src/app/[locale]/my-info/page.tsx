"use client";

import { useEffect, useState, useCallback, memo } from "react";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { useAuthContext, useProfile } from "@/features/auth";
import Image from "next/image";
import { PageHeader } from "@/components/ui/PageHeader";
import { Copy, Check } from "lucide-react";

// ─── Copy Button ──────────────────────────────────────────

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
      className="ds-control inline-flex items-center justify-center gap-1 rounded-lg border border-gray-200 px-2.5 text-gray-600 transition-colors hover:bg-gray-100"
      aria-label={`Copy ${fieldKey}`}
    >
      {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      <span className="ds-text-caption">{isCopied ? "복사됨" : "복사"}</span>
    </button>
  );
});

// ─── Loading Skeleton ─────────────────────────────────────

function LoadingSkeleton() {
  const t = useTranslations("auth");
  return (
    <div className="app-page-bleed bg-gray-50">
      <PageHeader title={t("myPage.editMember")} showBack showSearch={false} showShare={false} showHome={false} />
      <div className="app-page-tight pt-2 space-y-6">
        <div className="h-36 animate-pulse rounded-2xl bg-gray-200" />
        <div className="h-40 animate-pulse rounded-2xl bg-gray-200" />
        <div className="h-36 animate-pulse rounded-2xl bg-gray-200" />
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────

export default function MyInfoPage() {
  const router = useRouter();
  const t = useTranslations("auth");
  const { user, isAuthenticated, isLoading: authLoading } = useAuthContext();

  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [phoneInput, setPhoneInput] = useState("");
  const [phoneSaveStatus, setPhoneSaveStatus] = useState<"success" | "error" | null>(null);

  const { profile, isLoading: profileLoading, savePhone, isSavingPhone } = useProfile(
    isAuthenticated && !!user?.id
  );

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    const metadataPhone = typeof user?.user_metadata?.phone === "string" ? user.user_metadata.phone : "";
    const profilePhone = profile?.phone ?? "";
    setPhoneInput(profilePhone || metadataPhone || "");
  }, [profile?.phone, user?.user_metadata?.phone]);

  useEffect(() => {
    if (!phoneSaveStatus) return;
    const timer = setTimeout(() => setPhoneSaveStatus(null), 1800);
    return () => clearTimeout(timer);
  }, [phoneSaveStatus]);

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
    <div className="app-page-bleed bg-gray-50">
      <PageHeader title={t("myPage.editMember")} showBack showSearch={false} showShare={false} showHome={false} />

      <div className="app-page-tight pt-2 space-y-6">
        {/* Profile Hero */}
        <section className="overflow-hidden rounded-2xl border border-primary-200 bg-gradient-to-br from-primary-50 via-white to-secondary-50">
          <div className="p-4 sm:p-5">
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
                <p className="truncate ds-title-2 text-gray-900">{displayName}</p>
                <p className="truncate ds-text-body text-gray-600">{email || "-"}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {isLineUser ? (
                    <span className="ds-chip inline-flex items-center rounded-full border border-line-200 bg-line-100 px-2.5 font-medium text-line-700 sm:px-3">
                      {t("myPage.lineConnected")}
                    </span>
                  ) : null}
                  {profile?.user_identities?.some((identity) => identity.is_primary) ? (
                    <span className="ds-chip inline-flex items-center rounded-full border border-primary-200 bg-primary-100 px-2.5 font-medium text-primary-700 sm:px-3">
                      대표 계정
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Basic Info */}
        <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
          <h2 className="mb-4 ds-title-2 text-gray-900">{t("myPage.account.basicInfo")}</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-[120px_1fr_auto] sm:items-center sm:gap-3">
              <p className="ds-text-caption text-gray-500">{t("myPage.account.name")}</p>
              <p className="break-all ds-text-body text-gray-900">{displayName}</p>
              <div />
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-[120px_1fr_auto] sm:items-center sm:gap-3">
              <label htmlFor="user-phone" className="ds-text-caption text-gray-500">
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
                onClick={handleSavePhone}
                disabled={isSavingPhone || !isPhoneChanged}
                className="ds-control inline-flex w-full items-center justify-center rounded-lg bg-primary-600 px-3 font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-gray-300 sm:w-auto"
              >
                {isSavingPhone ? t("myPage.account.saving") : t("myPage.account.save")}
              </button>
            </div>
            {phoneSaveStatus === "success" ? (
              <p className="ds-text-body text-line-700">{t("myPage.account.phoneSaved")}</p>
            ) : phoneSaveStatus === "error" ? (
              <p className="ds-text-body text-red-600">{t("myPage.account.phoneSaveFailed")}</p>
            ) : null}
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-[120px_1fr_auto] sm:items-center sm:gap-3">
              <p className="ds-text-caption text-gray-500">{t("myPage.account.email")}</p>
              <p className="break-all ds-text-body text-gray-900">{email || "-"}</p>
              <CopyButton value={email} fieldKey="email" copiedField={copiedField} onCopy={handleCopy} />
            </div>
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-[120px_1fr_auto] sm:items-center sm:gap-3">
              <p className="ds-text-caption text-gray-500">{t("myPage.userId")}</p>
              <p className="break-all font-mono ds-text-caption text-gray-900">{user.id}</p>
              <CopyButton value={user.id} fieldKey="uid" copiedField={copiedField} onCopy={handleCopy} />
            </div>
          </div>
        </section>

        {/* LINE Info */}
        {isLineUser ? (
          <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
            <h2 className="mb-4 ds-title-2 text-gray-900">{t("myPage.account.lineInfo")}</h2>
            <div className="space-y-4">
              {lineDisplayName ? (
                <div>
                  <p className="mb-1 ds-text-caption text-gray-500">{t("myPage.account.lineDisplayName")}</p>
                  <p className="ds-text-body text-gray-900">{lineDisplayName}</p>
                </div>
              ) : null}
              {lineUserId ? (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div>
                    <p className="mb-1 ds-text-caption text-gray-500">{t("myPage.account.lineUserId")}</p>
                    <p className="break-all font-mono ds-text-caption text-gray-900">{lineUserId}</p>
                  </div>
                  <CopyButton value={lineUserId} fieldKey="line-id" copiedField={copiedField} onCopy={handleCopy} />
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        {/* Connected Accounts */}
        {profile?.user_identities && profile.user_identities.length > 0 ? (
          <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
            <h2 className="mb-4 ds-title-2 text-gray-900">{t("myPage.connectedAccounts")}</h2>
            <div className="flex flex-wrap gap-2.5">
              {profile.user_identities.map((identity) => (
                <span
                  key={identity.id}
                  className={`ds-chip inline-flex items-center border px-3 font-medium ${
                    identity.is_primary
                      ? "border-line-200 bg-line-100 text-line-700"
                      : "border-gray-200 bg-gray-100 text-gray-700"
                  }`}
                >
                  {identity.provider}
                  {identity.is_primary ? <span className="ml-1 ds-text-body">(Primary)</span> : null}
                </span>
              ))}
            </div>
          </section>
        ) : null}

      </div>
    </div>
  );
}
