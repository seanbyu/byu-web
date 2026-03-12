"use client";

import { useRef, useEffect } from "react";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { Bell, CalendarCheck, CalendarX, CalendarClock, BellRing } from "lucide-react";
import { useNotifications } from "../context/NotificationContext";
import type { AppNotification } from "../context/NotificationContext";

const actionBtnClass =
  "flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-gray-100";

function NotifIcon({ type }: { type: string }) {
  const cls = "h-4 w-4";
  if (type === "BOOKING_CONFIRMED") return <CalendarCheck className={cls} />;
  if (type === "BOOKING_CANCELLED") return <CalendarX className={cls} />;
  if (type === "BOOKING_MODIFIED") return <CalendarClock className={cls} />;
  return <BellRing className={cls} />;
}

const TYPE_COLOR: Record<string, string> = {
  BOOKING_CONFIRMED: "bg-green-100 text-green-600",
  BOOKING_CANCELLED: "bg-red-100 text-red-600",
  BOOKING_MODIFIED: "bg-yellow-100 text-yellow-600",
  BOOKING_REQUEST: "bg-blue-100 text-blue-600",
};

function NotificationItem({ notif, onClose }: { notif: AppNotification; onClose: () => void }) {
  const t = useTranslations("notifications");
  const router = useRouter();
  const { markRead } = useNotifications();

  const getRelativeTime = (dateStr: string): string => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return t("justNow");
    if (diffMins < 60) return t("minutesAgo", { count: diffMins });
    if (diffHours < 24) return t("hoursAgo", { count: diffHours });
    return t("daysAgo", { count: diffDays });
  };

  const KNOWN_TYPES = ["BOOKING_CONFIRMED", "BOOKING_CANCELLED", "BOOKING_MODIFIED", "BOOKING_REQUEST", "BOOKING_REMINDER", "BOOKING_COMPLETED", "GENERAL"];
  const getTypeLabel = (type: string): string => {
    const validType = KNOWN_TYPES.includes(type) ? type : "GENERAL";
    return t(`types.${validType}` as Parameters<typeof t>[0]);
  };

  const handleClick = () => {
    markRead(notif.id);
    onClose();
    if (notif.booking_id) {
      router.push(`/bookings/${notif.booking_id}`);
    } else {
      router.push("/notifications");
    }
  };

  const iconColor = TYPE_COLOR[notif.notification_type] ?? "bg-gray-100 text-gray-500";

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 ${
        !notif.read_at ? "bg-primary-50/30" : ""
      }`}
    >
      <div className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${iconColor}`}>
        <NotifIcon type={notif.notification_type} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className={`text-xs font-semibold ${!notif.read_at ? "text-gray-900" : "text-gray-600"}`}>
            {getTypeLabel(notif.notification_type)}
          </p>
          {!notif.read_at && (
            <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary-500" />
          )}
        </div>
        {!!(notif.metadata?.artist_name && notif.metadata?.booking_date) && (
          <p className="mt-0.5 line-clamp-1 text-[11px] text-gray-500">
            {String(notif.metadata!.artist_name)} · {String(notif.metadata!.booking_date)}{" "}
            {notif.metadata!.start_time ? String(notif.metadata!.start_time) : ""}
          </p>
        )}
        {!!notif.metadata?.salon_name && (
          <p className="line-clamp-1 text-[11px] text-gray-400">{String(notif.metadata!.salon_name)}</p>
        )}
        <p className="mt-0.5 text-[10px] text-gray-400">{getRelativeTime(notif.created_at)}</p>
      </div>
    </button>
  );
}

export function NotificationBell() {
  const t = useTranslations("notifications");
  const { unreadCount, notifications, isOpen, setIsOpen, markAllRead } = useNotifications();
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (
        panelRef.current?.contains(e.target as Node) ||
        btnRef.current?.contains(e.target as Node)
      )
        return;
      setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen, setIsOpen]);

  const recentNotifs = notifications.slice(0, 5);

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={actionBtnClass}
        aria-label={t("ariaLabel")}
      >
        <Bell className="h-5 w-5 text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-0.5 text-[10px] font-bold leading-none text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          ref={panelRef}
          className="absolute -right-4 top-full z-[100] mt-1 w-72 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <span className="text-sm font-semibold text-gray-900">{t("title")}</span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-[11px] text-gray-400 hover:text-gray-700"
              >
                {t("markAllRead")}
              </button>
            )}
          </div>

          {/* List */}
          {recentNotifs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10">
              <Bell className="mb-2 h-8 w-8 text-gray-200" />
              <p className="text-xs text-gray-400">{t("empty")}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentNotifs.map((notif) => (
                <NotificationItem
                  key={notif.id}
                  notif={notif}
                  onClose={() => setIsOpen(false)}
                />
              ))}
            </div>
          )}

          {/* Footer */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              router.push("/notifications");
            }}
            className="flex w-full items-center justify-center border-t border-gray-100 py-3 text-xs font-medium text-primary-600 hover:bg-gray-50"
          >
            {t("viewAll")}
          </button>
        </div>
      )}
    </div>
  );
}
