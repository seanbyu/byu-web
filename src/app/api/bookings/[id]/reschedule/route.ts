/**
 * Booking Reschedule API Route
 * POST /api/bookings/[id]/reschedule - 예약 일정 변경
 */

import { NextResponse } from "next/server";
import { createClient as createAuthClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { createBookingService } from "@/lib/api-core";
import { createNotificationService } from "@/lib/api-core/services/notification.service";
import type { Database } from "@/lib/supabase/types";

function getSupabaseAdmin() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const { id } = await params;

    const supabase = await createAuthClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "인증이 필요합니다" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { artist_id, booking_date, start_time, end_time } = body;

    if (!artist_id || !booking_date || !start_time || !end_time) {
      return NextResponse.json(
        { success: false, message: "필수 파라미터가 누락되었습니다" },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();
    const bookingService = createBookingService(supabaseAdmin);
    const data = await bookingService.rescheduleBooking(id, {
      artistId: artist_id,
      bookingDate: booking_date,
      startTime: start_time,
      endTime: end_time,
    });

    // 알림 생성 (fire-and-forget: 알림 실패가 응답을 지연시키지 않음)
    (async () => {
      try {
        const { data: booking } = await supabaseAdmin
          .from("bookings")
          .select(`
            salon_id,
            customer:customers!bookings_customer_id_fkey(name),
            artist:users!bookings_artist_id_fkey(id, name),
            service:services(name)
          `)
          .eq("id", id)
          .single();

        if (!booking) return;
        const notificationService = createNotificationService(supabaseAdmin);
        await notificationService.createRescheduleNotifications({
          bookingId: id,
          salonId: booking.salon_id,
          customerName: (booking.customer as any)?.name || "고객",
          artistId: (booking.artist as any)?.id || artist_id,
          artistName: (booking.artist as any)?.name || "",
          newBookingDate: booking_date,
          newStartTime: start_time,
          serviceName: (booking.service as any)?.name,
        });
      } catch (err) {
        console.error("[Reschedule] Notification error:", err);
      }
    })();

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "서버 오류가 발생했습니다";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
