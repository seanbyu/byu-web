/**
 * Salon Staff API Routes
 * GET /api/salons/[salonId]/staff - 살롱의 예약 가능한 직원 조회
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createSalonService } from "@/lib/api-core";

type Params = {
  params: Promise<{ salonId: string }>;
};

// GET: 살롱의 예약 가능한 직원 조회
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { salonId } = await params;
    const supabase = await createClient();
    const salonService = createSalonService(supabase);

    const staff = await salonService.getBookableStaff(salonId);

    return NextResponse.json({ success: true, data: staff });
  } catch (error) {
    console.error("Salon staff API error:", error);
    const message = error instanceof Error ? error.message : "서버 오류가 발생했습니다";
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
