/**
 * Customer Find or Create API
 * POST /api/customers/find-or-create - 고객 찾기 또는 생성
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient as createAuthClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { createCustomerService, createLineService } from "@/lib/api-core";
import type { Database } from "@/lib/supabase/types";

function getSupabaseAdmin() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(request: NextRequest) {
  try {
    // 인증 확인 (cookie 기반 클라이언트)
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

    // RLS를 우회하기 위해 service_role 클라이언트 사용
    const supabaseAdmin = getSupabaseAdmin();
    const customerService = createCustomerService(supabaseAdmin);

    console.log("Customer find-or-create request:", {
      salon_id: body.salon_id,
      user_id: user.id,
      name: body.name,
      phone: body.phone,
    });

    // 고객 찾기 또는 생성
    let customer = await customerService.findOrCreateCustomer({
      salonId: body.salon_id,
      userId: user.id,
      name: body.name,
      phone: body.phone,
      lineUserId: user.user_metadata?.line_user_id,
      lineDisplayName: user.user_metadata?.full_name,
      linePictureUrl: user.user_metadata?.avatar_url,
    });

    console.log("Customer found/created:", customer.id);

    // LINE 친구 상태 초기화: line_user_id가 있을 때 실제 친구 여부 확인 후 line_blocked 업데이트
    if (customer.line_user_id) {
      const lineService = createLineService(supabaseAdmin);
      const { isFriend, salonHasLine } = await lineService.checkFriendship(
        body.salon_id,
        customer.line_user_id
      );

      if (salonHasLine) {
        customer = await supabaseAdmin
          .from("customers")
          .update({ line_blocked: !isFriend })
          .eq("id", customer.id)
          .select()
          .single()
          .then(({ data }) => data ?? customer);
      }
    }

    return NextResponse.json({ success: true, data: customer });
  } catch (error: unknown) {
    console.error("Customer find-or-create error:", error);
    const message =
      error instanceof Error
        ? error.message
        : typeof error === "object" && error !== null && "message" in error
          ? String((error as { message: unknown }).message)
          : "서버 오류가 발생했습니다";

    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
