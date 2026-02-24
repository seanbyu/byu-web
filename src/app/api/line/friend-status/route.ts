/**
 * LINE Friend Status API
 * GET /api/line/friend-status?salonId=xxx
 *
 * 현재 유저가 살롱의 LINE 공식계정을 친구추가했는지 확인
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient as createAuthClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { createLineService } from "@/lib/api-core";
import type { Database } from "@/lib/supabase/types";

function getSupabaseAdmin() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const salonId = searchParams.get("salonId");

    if (!salonId) {
      return NextResponse.json(
        { success: false, message: "salonId is required" },
        { status: 400 }
      );
    }

    // 인증 확인
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

    // user metadata에서 line_user_id 추출
    const lineUserId = (user.user_metadata?.line_user_id as string) || null;

    // RLS 우회를 위해 admin client 사용 (salon_line_settings 조회)
    const supabaseAdmin = getSupabaseAdmin();
    const lineService = createLineService(supabaseAdmin);
    const data = await lineService.checkFriendship(salonId, lineUserId);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("LINE friend status check error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to check LINE friend status" },
      { status: 500 }
    );
  }
}
