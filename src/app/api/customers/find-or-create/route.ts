/**
 * Customer Find or Create API
 * POST /api/customers/find-or-create - 고객 찾기 또는 생성
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createCustomerService } from "@/lib/api-core";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 인증 확인
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

    // 먼저 customers 테이블이 존재하는지 테스트
    const { error: testError } = await supabase
      .from("customers")
      .select("id")
      .limit(1);

    if (testError) {
      console.error("Customers table access error:", testError);
      return NextResponse.json(
        {
          success: false,
          message: "customers 테이블 접근 실패: " + testError.message,
          code: testError.code,
          details: testError.details,
        },
        { status: 500 }
      );
    }

    const customerService = createCustomerService(supabase);

    console.log("Customer find-or-create request:", {
      salon_id: body.salon_id,
      user_id: user.id,
      name: body.name,
      phone: body.phone,
    });

    // 고객 찾기 또는 생성
    const customer = await customerService.findOrCreateCustomer({
      salonId: body.salon_id,
      userId: user.id,
      name: body.name,
      phone: body.phone,
      lineUserId: user.user_metadata?.provider_id,
      lineDisplayName: user.user_metadata?.name,
      linePictureUrl: user.user_metadata?.picture,
    });

    console.log("Customer found/created:", customer.id);

    return NextResponse.json({ success: true, data: customer });
  } catch (error) {
    console.error("Customer find-or-create error:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    const message = error instanceof Error ? error.message : "서버 오류가 발생했습니다";

    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
