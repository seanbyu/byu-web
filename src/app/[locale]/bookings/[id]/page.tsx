"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Home,
  Check,
  Calendar,
  Clock,
  MapPin,
  User,
  Scissors,
  Phone,
} from "lucide-react";
import { Link } from "@/i18n/routing";
import { useAuthContext } from "@/features/auth";
import { createClient } from "@/lib/supabase/client";
import type { Booking, Salon, Service, StaffWithProfile } from "@/lib/supabase/types";

type BookingWithDetails = Booking & {
  salons: Salon;
  services: Service;
  designer: {
    id: string;
    name: string;
    profile_image: string | null;
  };
};

export default function BookingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const bookingId = params.id as string;
  const t = useTranslations("booking");
  const { isAuthenticated, isLoading: authLoading } = useAuthContext();

  const [booking, setBooking] = useState<BookingWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    fetchBooking();
  }, [authLoading, isAuthenticated, bookingId]);

  const fetchBooking = async () => {
    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          salons (*),
          services (*),
          designer:users!bookings_designer_id_fkey (
            id,
            name,
            profile_image
          )
        `)
        .eq("id", bookingId)
        .single();

      if (error) throw error;
      setBooking(data as unknown as BookingWithDetails);
    } catch (err) {
      console.error("Error fetching booking:", err);
      setError("예약 정보를 불러올 수 없습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const days = ["일", "월", "화", "수", "목", "금", "토"];
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 (${days[date.getDay()]})`;
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
        return "bg-gray-100 text-gray-700";
      case "CANCELLED":
      case "NO_SHOW":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusText = (status: Booking["status"]) => {
    switch (status) {
      case "CONFIRMED":
        return "확정";
      case "PENDING":
        return "대기중";
      case "IN_PROGRESS":
        return "진행중";
      case "COMPLETED":
        return "완료";
      case "CANCELLED":
        return "취소됨";
      case "NO_SHOW":
        return "노쇼";
      default:
        return status;
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="bg-white">
        <div className="h-14 bg-gray-100 animate-pulse" />
        <div className="p-4 space-y-4">
          <div className="h-32 bg-gray-100 rounded-xl animate-pulse" />
          <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="bg-white">
        <header className="sticky top-0 bg-white border-b border-gray-100">
          <div className="flex items-center justify-between px-4 h-14">
            <button onClick={() => router.back()} className="touch-target -ml-2 rounded-full p-2">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="font-semibold">예약 상세</span>
            <div className="w-9" />
          </div>
        </header>
        <div className="p-4 text-center text-gray-500 mt-12">
          {error || "예약을 찾을 수 없습니다."}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between px-4 h-14">
          <button
            onClick={() => router.back()}
            className="touch-target -ml-2 rounded-full p-2 transition-colors hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-semibold">예약 상세</span>
          <Link href="/" className="touch-target -mr-2 rounded-full p-2 transition-colors hover:bg-gray-100" aria-label="Home">
            <Home className="w-5 h-5" />
          </Link>
        </div>
      </header>

      <div className="p-4 space-y-4">
          {/* Success Banner (for new bookings) */}
          {booking.status === "PENDING" && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <Check className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-medium text-green-800">{t("bookingConfirmed")}</p>
                <p className="text-sm text-green-600">예약이 접수되었습니다.</p>
              </div>
            </div>
          )}

          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">예약 상태</span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
              {getStatusText(booking.status)}
            </span>
          </div>

          {/* Booking Details Card */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-4">
            {/* Salon */}
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-primary-500 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">{t("salon")}</p>
                <p className="font-medium">{booking.salons.name}</p>
                <p className="text-sm text-gray-500">{booking.salons.address}</p>
              </div>
            </div>

            {/* Service */}
            <div className="flex items-start gap-3">
              <Scissors className="w-5 h-5 text-primary-500 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">{t("service")}</p>
                <p className="font-medium">{booking.services.name}</p>
                <p className="text-sm text-gray-500">{booking.duration_minutes}분</p>
              </div>
            </div>

            {/* Designer */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                {booking.designer.profile_image ? (
                  <img
                    src={booking.designer.profile_image}
                    alt={booking.designer.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-5 h-5 text-gray-400" />
                )}
              </div>
              <div>
                <p className="text-sm text-gray-500">{t("designer")}</p>
                <p className="font-medium">{booking.designer.name}</p>
              </div>
            </div>

            {/* Date & Time */}
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-primary-500 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">{t("dateTime")}</p>
                <p className="font-medium">{formatDate(booking.booking_date)}</p>
                <p className="text-sm text-gray-600">
                  {booking.start_time} - {booking.end_time}
                </p>
              </div>
            </div>

            {/* Customer Notes */}
            {booking.customer_notes && (
              <div className="pt-3 border-t border-gray-200">
                <p className="mb-1 text-sm text-gray-500">{t("customerNotes")}</p>
                <p className="text-sm text-gray-700">{booking.customer_notes}</p>
              </div>
            )}

            {/* Price */}
            <div className="pt-3 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">{t("totalPrice")}</span>
                <span className="text-xl font-bold text-primary-600">
                  ฿{booking.total_price.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Contact Salon */}
          {booking.salons.phone && (
            <a
              href={`tel:${booking.salons.phone}`}
              className="touch-target flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 py-3 transition-colors hover:bg-gray-50"
            >
              <Phone className="w-5 h-5 text-gray-600" />
              <span className="font-medium text-gray-700">살롱에 전화하기</span>
            </a>
          )}

          {/* Cancel Button (only for pending/confirmed) */}
          {(booking.status === "PENDING" || booking.status === "CONFIRMED") && (
            <button
              className="touch-target w-full rounded-xl py-3 font-medium text-red-500 transition-colors hover:bg-red-50"
              onClick={() => {
                // TODO: Implement cancel booking
                alert("예약 취소 기능은 준비 중입니다.");
              }}
            >
              {t("cancelBooking")}
            </button>
          )}
      </div>
    </div>
  );
}
