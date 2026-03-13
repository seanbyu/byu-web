"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import {
  Calendar,
  MapPin,
  User,
  Scissors,
  Clock,
  CreditCard,
  Banknote,
  Wallet,
} from "lucide-react";
import { clsx } from "clsx";
import { Link } from "@/i18n/routing";
import { useAuthContext } from "@/features/auth";
import { bookingQueries } from "@/lib/api/queries";
import { PageHeader } from "@/components/ui/PageHeader";
import { BookingCardSkeleton } from "@/components/ui/Skeleton";
import type { Booking, Salon, Service } from "@/lib/supabase/types";

type BookingWithDetails = Booking & {
  salons: Pick<Salon, "id" | "name" | "address" | "phone" | "settings">;
  services: Pick<Service, "id" | "name">;
  designer: {
    id: string;
    name: string;
    profile_image: string | null;
  };
};

type TabKey = "upcoming" | "past" | "cancelled";

export function BookingHistoryView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("booking");
  const locale = useLocale();
  const { isAuthenticated, isLoading: authLoading } = useAuthContext();

  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const initialTab = (searchParams.get("tab") as TabKey) || "upcoming";
  const validTabs: TabKey[] = ["upcoming", "past", "cancelled"];
  const [activeTab, setActiveTab] = useState<TabKey>(
    validTabs.includes(initialTab) ? initialTab : "upcoming"
  );

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    fetchBookings();
  }, [authLoading, isAuthenticated]);

  const fetchBookings = async () => {
    try {
      const data = await bookingQueries.getMy();
      setBookings((data || []) as BookingWithDetails[]);
    } catch {
      // silently fail
    } finally {
      setIsLoading(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];

  const filteredBookings = bookings.filter((b) => {
    if (activeTab === "cancelled") {
      return b.status === "CANCELLED" || b.status === "NO_SHOW";
    }
    if (activeTab === "past") {
      return (
        (b.status === "COMPLETED" || b.booking_date < today) &&
        b.status !== "CANCELLED" &&
        b.status !== "NO_SHOW"
      );
    }
    // upcoming
    return (
      b.booking_date >= today &&
      b.status !== "CANCELLED" &&
      b.status !== "NO_SHOW" &&
      b.status !== "COMPLETED"
    );
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    if (locale === "ko") {
      const days = ["일", "월", "화", "수", "목", "금", "토"];
      return `${date.getMonth() + 1}월 ${date.getDate()}일 (${days[date.getDay()]})`;
    }
    if (locale === "th") {
      return date.toLocaleDateString("th-TH", {
        month: "short",
        day: "numeric",
        weekday: "short",
      });
    }
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      weekday: "short",
    });
  };

  const getStatusColor = (status: Booking["status"]) => {
    switch (status) {
      case "CONFIRMED":
        return "bg-green-100 text-green-700";
      case "PENDING":
        return "bg-yellow-100 text-yellow-700";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-700";
      case "COMPLETED":
        return "bg-gray-100 text-gray-600";
      case "CANCELLED":
      case "NO_SHOW":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const getStatusText = (status: Booking["status"]) => {
    switch (status) {
      case "CONFIRMED":
        return t("statusConfirmed");
      case "PENDING":
        return t("statusPending");
      case "IN_PROGRESS":
        return t("statusInProgress");
      case "COMPLETED":
        return t("statusCompleted");
      case "CANCELLED":
        return t("statusCancelled");
      case "NO_SHOW":
        return t("statusNoShow");
      default:
        return status;
    }
  };

  const getPaymentMethodIcon = (method: string | null) => {
    if (!method) return <Wallet className="w-3.5 h-3.5 shrink-0" />;
    if (method === "CASH") return <Banknote className="w-3.5 h-3.5 shrink-0" />;
    return <CreditCard className="w-3.5 h-3.5 shrink-0" />;
  };

  const getPaymentMethodText = (method: string | null) => {
    switch (method) {
      case "CASH": return t("paymentMethodCash");
      case "CREDIT_CARD": return t("paymentMethodCard");
      case "BANK_TRANSFER": return t("paymentMethodTransfer");
      case "MOBILE_PAYMENT":
      case "LINE_PAY":
      case "TRUE_MONEY":
      case "RABBIT_LINE_PAY":
      case "SHOPEE_PAY": return t("paymentMethodMobile");
      default: return t("totalPrice");
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">{t("paymentStatusPaid")}</span>;
      case "REFUNDED":
        return <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">{t("paymentStatusRefunded")}</span>;
      case "FAILED":
        return <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-medium">{t("paymentStatusFailed")}</span>;
      default:
        return null;
    }
  };

  const pastBookings = bookings.filter((b) =>
    (b.status === "COMPLETED" || b.booking_date < today) &&
    b.status !== "CANCELLED" &&
    b.status !== "NO_SHOW"
  );

  const totalSpent = pastBookings
    .filter((b) => b.payment_status === "PAID" && b.total_price > 0)
    .reduce((sum, b) => sum + b.total_price, 0);

  const tabs: { key: TabKey; label: string }[] = [
    { key: "upcoming", label: t("upcoming") },
    { key: "past", label: t("past") },
    { key: "cancelled", label: t("cancelled") },
  ];

  if (authLoading || isLoading) {
    return (
      <div className="app-page-bleed bg-white">
        <PageHeader title={t("myBookings")} showBell showLanguage showHome={false} showSearch={false} showShare={false} />
        <div className="p-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <BookingCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="app-page-bleed bg-white min-h-screen">
      <PageHeader
        title={t("myBookings")}
        showBell
        showLanguage
        showHome={false}
        showSearch={false}
        showShare={false}
      />

      {/* Tabs */}
      <div className="sticky top-14 z-40 bg-white border-b border-gray-100">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={clsx(
                "ds-control relative flex-1 px-2 text-center font-medium transition-colors",
                activeTab === tab.key
                  ? "text-gray-900"
                  : "text-gray-400"
              )}
            >
              {tab.label}
              {activeTab === tab.key && (
                <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-gray-900 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Booking List */}
      <div className="p-4 pb-24 space-y-3">
        {/* 결제 요약 (past 탭) */}
        {activeTab === "past" && totalSpent > 0 && (
          <div className="rounded-xl bg-primary-50 p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-0.5">{t("totalSpent")}</p>
              <p className="text-xl font-bold text-primary-600">฿{totalSpent.toLocaleString()}</p>
            </div>
            <Wallet className="w-8 h-8 text-primary-300" />
          </div>
        )}

        {filteredBookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Calendar className="w-12 h-12 text-gray-200 mb-3" />
            <p className="ds-text-body text-gray-400">{t("noBookings")}</p>
          </div>
        ) : (
          filteredBookings.map((booking) => (
            <Link
              key={booking.id}
              href={`/bookings/${booking.id}` as "/bookings"}
              className="block rounded-xl border border-gray-100 p-4 transition-colors hover:bg-gray-50 active:bg-gray-50"
            >
              {/* Top: Salon name + Status */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="ds-text-body truncate font-semibold text-gray-900">
                    {booking.salons?.name}
                  </span>
                </div>
                <span
                  className={clsx(
                    "ds-badge ml-2 shrink-0 px-2 font-medium",
                    getStatusColor(booking.status)
                  )}
                >
                  {getStatusText(booking.status)}
                </span>
              </div>

              {/* Details */}
              <div className="space-y-1.5 ds-text-body text-gray-500">
                {/* Date & Time */}
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {formatDate(booking.booking_date)} · {booking.start_time.slice(0, 5)}
                  </span>
                </div>

                {/* Category (Cut, Perm 등 큰 카테고리) */}
                {(() => {
                  const meta = booking.booking_meta as Record<string, unknown> | null;
                  const categoryName = meta?.category_name as string | undefined;
                  if (!categoryName) return null;
                  return (
                    <div className="flex items-center gap-2">
                      <Scissors className="w-3.5 h-3.5 shrink-0" />
                      <span>{categoryName}</span>
                    </div>
                  );
                })()}

                {/* Designer */}
                {booking.designer?.name && (
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 shrink-0" />
                    <span>{booking.designer.name}</span>
                  </div>
                )}
              </div>

              {/* 결제 정보 (지난 예약만) */}
              {activeTab === "past" && booking.total_price > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      {getPaymentMethodIcon(booking.payment_method)}
                      <span>{getPaymentMethodText(booking.payment_method)}</span>
                      {getPaymentStatusBadge(booking.payment_status)}
                    </div>
                    <span className="text-[17px] font-bold text-primary-600">
                      ฿{booking.total_price.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
