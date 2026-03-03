/**
 * Booking Cancel API Route
 * POST /api/bookings/[id]/cancel - 예약 취소
 */

import { NextResponse } from "next/server";
import { createClient as createAuthClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { createBookingService } from "@/lib/api-core";
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
    const reason = body.cancellation_reason || undefined;

    // Verify ownership via user's client (RLS ensures customer can only see their own bookings)
    const { data: ownerCheck } = await supabase
      .from("bookings")
      .select("id")
      .eq("id", id)
      .single();

    if (!ownerCheck) {
      return NextResponse.json(
        { success: false, message: "예약을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // Use admin client to bypass RLS UPDATE restriction
    // (RLS only allows customer UPDATE when status = 'PENDING', blocking CONFIRMED cancellations)
    const supabaseAdmin = getSupabaseAdmin();
    const bookingService = createBookingService(supabaseAdmin);
    const data = await bookingService.cancelBooking(id, user.id, reason);

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "서버 오류가 발생했습니다";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
