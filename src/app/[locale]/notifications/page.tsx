"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { useAuthContext } from "@/features/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { Bell, Check } from "lucide-react";

type NotificationType =
  | "BOOKING_REQUEST"
  | "BOOKING_CONFIRMED"
  | "BOOKING_CANCELLED"
  | "BOOKING_MODIFIED"
  | "BOOKING_REMINDER"
  | "BOOKING_COMPLETED"
  | "BOOKING_NO_SHOW"
  | "GENERAL";

interface AppNotification {
  id: string;
  notification_type: NotificationType;
  title: string | null;
  body: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  read_at: string | null;
  booking_id: string | null;
  salon_id: string;
}

function getRelativeTime(dateStr: string): string {
  const now = new Date();
  const past = new Date(dateStr);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "방금 전";
  if (diffMins < 60) return `${diffMins}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  return `${diffDays}일 전`;
}

const TYPE_ICON_COLOR: Record<NotificationType | "default", string> = {
  BOOKING_REQUEST: "bg-blue-100 text-blue-600",
  BOOKING_CONFIRMED: "bg-green-100 text-green-600",
  BOOKING_CANCELLED: "bg-red-100 text-red-600",
  BOOKING_MODIFIED: "bg-yellow-100 text-yellow-600",
  BOOKING_REMINDER: "bg-purple-100 text-purple-600",
  BOOKING_COMPLETED: "bg-teal-100 text-teal-600",
  BOOKING_NO_SHOW: "bg-gray-100 text-gray-600",
  GENERAL: "bg-gray-100 text-gray-600",
  default: "bg-gray-100 text-gray-600",
};

export default function NotificationsPage() {
  const router = useRouter();
  const t = useTranslations("auth");
  const { isAuthenticated, isLoading } = useAuthContext();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/");
    }
  }, [isLoading, isAuthenticated, router]);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?limit=50");
      const json = await res.json();
      if (json.success) {
        setNotifications(json.data ?? []);
      }
    } catch {
      // silent
    } finally {
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    }
  }, [isAuthenticated, fetchNotifications]);

  const handleNotificationClick = async (notif: AppNotification) => {
    // 읽음 처리
    if (!notif.read_at) {
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notif.id ? { ...n, read_at: new Date().toISOString() } : n
        )
      );
      fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: notif.id }),
      }).catch(() => {});
    }

    // 예약 관련 알림이면 예약 상세로 이동
    if (notif.booking_id) {
      router.push(`/bookings/${notif.booking_id}`);
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() }))
    );
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
    } catch {
      // silent
    } finally {
      setMarkingAll(false);
    }
  };

  if (!isAuthenticated) return null;

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  const getTitle = (notif: AppNotification) => {
    const typeKey = `myPage.notificationTypes.${notif.notification_type}` as Parameters<typeof t>[0];
    try {
      return t(typeKey);
    } catch {
      return notif.title || notif.notification_type;
    }
  };

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

      {/* 전체 읽음 버튼 */}
      {unreadCount > 0 && (
        <div className="flex items-center justify-end px-4 py-2 border-b border-gray-100">
          <button
            type="button"
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 transition-colors disabled:opacity-50"
          >
            <Check className="h-3.5 w-3.5" />
            {t("myPage.markAllRead")}
          </button>
        </div>
      )}

      {isFetching ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-sm text-gray-400">{t("myPage.notificationsLoading")}</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <Bell className="h-7 w-7 text-gray-300" />
          </div>
          <p className="text-sm font-medium text-gray-500">{t("myPage.notificationsEmpty")}</p>
          <p className="mt-1 text-xs text-gray-400">{t("myPage.notificationsEmptyDesc")}</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {notifications.map((notif) => {
            const iconColor =
              TYPE_ICON_COLOR[notif.notification_type] ?? TYPE_ICON_COLOR.default;

            return (
              <button
                key={notif.id}
                type="button"
                onClick={() => handleNotificationClick(notif)}
                className={`flex w-full items-start gap-3 px-4 py-4 text-left transition-colors hover:bg-gray-50 ${
                  !notif.read_at ? "bg-primary-50/40" : ""
                }`}
              >
                <div
                  className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold ${iconColor}`}
                >
                  <Bell className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-sm font-medium ${!notif.read_at ? "text-gray-900" : "text-gray-600"}`}>
                      {getTitle(notif)}
                    </p>
                    {!notif.read_at && (
                      <span className="h-2 w-2 flex-shrink-0 rounded-full bg-primary-500" />
                    )}
                  </div>
                  {/* metadata에서 상세 정보 표시 */}
                  {!!notif.metadata?.artist_name && !!notif.metadata?.booking_date && (
                    <p className="mt-0.5 text-xs text-gray-500 line-clamp-1">
                      {String(notif.metadata.artist_name)}
                      {notif.metadata.start_time ? ` · ${String(notif.metadata.booking_date)} ${String(notif.metadata.start_time)}` : ""}
                    </p>
                  )}
                  {!!notif.metadata?.salon_name && (
                    <p className="mt-0.5 text-xs text-gray-400 line-clamp-1">
                      {String(notif.metadata.salon_name)}
                    </p>
                  )}
                  <p className="mt-1 text-[11px] text-gray-400">
                    {getRelativeTime(notif.created_at)}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
