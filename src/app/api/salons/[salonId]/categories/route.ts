/**
 * Salon Categories API Routes
 * GET /api/salons/[salonId]/categories - 살롱의 서비스 카테고리 조회
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createSalonService } from "@/lib/api-core";

type Params = {
  params: Promise<{ salonId: string }>;
};

// GET: 살롱의 서비스 카테고리 조회
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { salonId } = await params;
    const supabase = await createClient();
    const salonService = createSalonService(supabase);

    const categories = await salonService.getServiceCategories(salonId);

    return NextResponse.json({ success: true, data: categories });
  } catch (error) {
    console.error("Salon categories API error:", error);
    const message = error instanceof Error ? error.message : "서버 오류가 발생했습니다";
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
