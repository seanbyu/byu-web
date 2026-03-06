/**
 * /api/notifications
 *
 * GET  — 로그인한 고객의 IN_APP 알림 목록 조회
 * PATCH — 알림 읽음 처리 (단건 or 전체)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

function getSupabaseAdmin() {
  return createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// ─────────────────────────────────────────
// GET /api/notifications
// Query: ?limit=30
// ─────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: "인증이 필요합니다" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get("limit") ?? 30), 100);

    const supabaseAdmin = getSupabaseAdmin();

    // user_id → customer_id 조회 (한 유저가 여러 살롱의 고객일 수 있음)
    const { data: customers } = await supabaseAdmin
      .from("customers")
      .select("id")
      .eq("user_id", user.id);

    if (!customers || customers.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    const customerIds = customers.map((c) => c.id);

    const { data, error } = await supabaseAdmin
      .from("notifications")
      .select("id, notification_type, title, body, metadata, created_at, read_at, booking_id, salon_id")
      .in("recipient_customer_id", customerIds)
      .eq("recipient_type", "CUSTOMER")
      .eq("channel", "IN_APP")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    return NextResponse.json({ success: true, data: data ?? [] });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "서버 오류가 발생했습니다";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

// ─────────────────────────────────────────
// PATCH /api/notifications
// Body: { id?: string }  — id 없으면 전체 읽음
// ─────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: "인증이 필요합니다" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { id } = body as { id?: string };

    const supabaseAdmin = getSupabaseAdmin();

    // 소유권 검증: 이 유저의 customer_id 목록
    const { data: customers } = await supabaseAdmin
      .from("customers")
      .select("id")
      .eq("user_id", user.id);

    if (!customers || customers.length === 0) {
      return NextResponse.json({ success: true, data: null });
    }

    const customerIds = customers.map((c) => c.id);
    const readAt = new Date().toISOString();

    let query = supabaseAdmin
      .from("notifications")
      .update({ read_at: readAt } as never)
      .in("recipient_customer_id", customerIds)
      .eq("channel", "IN_APP")
      .is("read_at", null);

    if (id) {
      query = query.eq("id", id);
    }

    const { error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true, data: null });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "서버 오류가 발생했습니다";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
