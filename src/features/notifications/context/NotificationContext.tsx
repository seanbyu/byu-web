"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useAuthContext } from "@/features/auth";
import { createClient } from "@/lib/supabase/client";

export interface AppNotification {
  id: string;
  notification_type: string;
  title: string | null;
  body: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  read_at: string | null;
  booking_id: string | null;
  salon_id: string;
}

interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  refresh: () => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

const TOAST_TYPES = new Set(["BOOKING_CONFIRMED", "BOOKING_CANCELLED"]);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthContext();
  const t = useTranslations("booking.notifications");
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?limit=20");
      const json = await res.json();
      if (json.success) {
        setNotifications(json.data ?? []);
      }
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      setIsOpen(false);
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
      return;
    }

    // 초기 데이터 로드
    fetchNotifications();

    // Supabase Realtime 구독 — INSERT 이벤트만 수신
    // RLS가 현재 유저의 알림만 필터링해줌
    const supabase = createClient();
    const channel = supabase
      .channel("customer-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: "channel=eq.IN_APP",
        },
        (payload) => {
          const newNotification = payload.new as AppNotification;
          setNotifications((prev) => [newNotification, ...prev]);

          if (TOAST_TYPES.has(newNotification.notification_type)) {
            const isConfirmed = newNotification.notification_type === "BOOKING_CONFIRMED";
            const title = t(isConfirmed ? "confirmedTitle" : "cancelledTitle");
            if (isConfirmed) {
              toast.success(title, { duration: 5000 });
            } else {
              toast.error(title, { duration: 5000 });
            }
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [isAuthenticated, fetchNotifications]);

  const markRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
    );
    fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    }).catch(() => {});
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() }))
    );
    fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    }).catch(() => {});
  }, []);

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, isOpen, setIsOpen, markRead, markAllRead, refresh: fetchNotifications }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
}
