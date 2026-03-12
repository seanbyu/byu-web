"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { useAuthContext } from "@/features/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { Bell, Check, CalendarCheck, CalendarX, CalendarClock, BellRing } from "lucide-react";
import { useNotifications } from "@/features/notifications/context/NotificationContext";
import type { AppNotification } from "@/features/notifications/context/NotificationContext";

const TYPE_COLOR: Record<string, string> = {
  BOOKING_CONFIRMED: "bg-green-100 text-green-600",
  BOOKING_CANCELLED: "bg-red-100 text-red-600",
  BOOKING_MODIFIED: "bg-yellow-100 text-yellow-600",
  BOOKING_REQUEST: "bg-blue-100 text-blue-600",
  BOOKING_REMINDER: "bg-purple-100 text-purple-600",
  BOOKING_COMPLETED: "bg-teal-100 text-teal-600",
  BOOKING_NO_SHOW: "bg-gray-100 text-gray-600",
  GENERAL: "bg-gray-100 text-gray-600",
};

const KNOWN_TYPES = ["BOOKING_CONFIRMED", "BOOKING_CANCELLED", "BOOKING_MODIFIED", "BOOKING_REQUEST", "BOOKING_REMINDER", "BOOKING_COMPLETED", "BOOKING_NO_SHOW", "GENERAL"];

function NotifIcon({ type }: { type: string }) {
  const cls = "h-4 w-4";
  if (type === "BOOKING_CONFIRMED") return <CalendarCheck className={cls} />;
  if (type === "BOOKING_CANCELLED") return <CalendarX className={cls} />;
  if (type === "BOOKING_MODIFIED") return <CalendarClock className={cls} />;
  return <BellRing className={cls} />;
}

function NotificationRow({ notif }: { notif: AppNotification }) {
  const tN = useTranslations("notifications");
  const router = useRouter();
  const { markRead } = useNotifications();

  const getRelativeTime = (dateStr: string): string => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return tN("justNow");
    if (diffMins < 60) return tN("minutesAgo", { count: diffMins });
    if (diffHours < 24) return tN("hoursAgo", { count: diffHours });
    return tN("daysAgo", { count: diffDays });
  };

  const getTypeLabel = (type: string): string => {
    const validType = KNOWN_TYPES.includes(type) ? type : "GENERAL";
    return tN(`types.${validType}` as Parameters<typeof tN>[0]);
  };

  const handleClick = () => {
    if (!notif.read_at) markRead(notif.id);
    if (notif.booking_id) router.push(`/bookings/${notif.booking_id}`);
  };

  const iconColor = TYPE_COLOR[notif.notification_type] ?? "bg-gray-100 text-gray-500";

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`flex w-full items-start gap-3 px-4 py-4 text-left transition-colors hover:bg-gray-50 ${
        !notif.read_at ? "bg-primary-50/40" : ""
      }`}
    >
      <div className={`mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${iconColor}`}>
        <NotifIcon type={notif.notification_type} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className={`text-sm font-medium ${!notif.read_at ? "text-gray-900" : "text-gray-600"}`}>
            {getTypeLabel(notif.notification_type)}
          </p>
          {!notif.read_at && (
            <span className="h-2 w-2 flex-shrink-0 rounded-full bg-primary-500" />
          )}
        </div>
        {!!(notif.metadata?.artist_name && notif.metadata?.booking_date) && (
          <p className="mt-0.5 line-clamp-1 text-xs text-gray-500">
            {String(notif.metadata!.artist_name)} · {String(notif.metadata!.booking_date)}{" "}
            {notif.metadata!.start_time ? String(notif.metadata!.start_time) : ""}
          </p>
        )}
        {!!notif.metadata?.salon_name && (
          <p className="line-clamp-1 text-xs text-gray-400">{String(notif.metadata!.salon_name)}</p>
        )}
        <p className="mt-1 text-[11px] text-gray-400">{getRelativeTime(notif.created_at)}</p>
      </div>
    </button>
  );
}

export default function NotificationsPage() {
  const router = useRouter();
  const t = useTranslations("auth");
  const { isAuthenticated, isLoading } = useAuthContext();
  const { notifications, unreadCount, markAllRead, refresh } = useNotifications();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/");
    }
  }, [isLoading, isAuthenticated, router]);

  // 페이지 진입 시 최신 데이터 갱신
  useEffect(() => {
    if (isAuthenticated) refresh();
  }, [isAuthenticated, refresh]);

  if (!isAuthenticated) return null;

  return (
    <div className="app-page-bleed min-h-screen bg-white">
      <PageHeader
        title={t("myPage.notificationsTitle")}
        showBack
        showLanguage
        showSearch={false}
        showShare={false}
        showHome={false}
      />

      {unreadCount > 0 && (
        <div className="flex items-center justify-end border-b border-gray-100 px-4 py-2">
          <button
            type="button"
            onClick={markAllRead}
            className="flex items-center gap-1 text-xs text-gray-400 transition-colors hover:text-gray-700"
          >
            <Check className="h-3.5 w-3.5" />
            {t("myPage.markAllRead")}
          </button>
        </div>
      )}

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <Bell className="h-7 w-7 text-gray-300" />
          </div>
          <p className="text-sm font-medium text-gray-500">{t("myPage.notificationsEmpty")}</p>
          <p className="mt-1 text-xs text-gray-400">{t("myPage.notificationsEmptyDesc")}</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {notifications.map((notif) => (
            <NotificationRow key={notif.id} notif={notif} />
          ))}
        </div>
      )}
    </div>
  );
}
