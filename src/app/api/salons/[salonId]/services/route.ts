/**
 * Salon Services API Routes
 * GET /api/salons/[salonId]/services - 살롱의 서비스 목록 조회
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createSalonService } from "@/lib/api-core";

type Params = {
  params: Promise<{ salonId: string }>;
};

// GET: 살롱의 서비스 목록 조회
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { salonId } = await params;
    const supabase = await createClient();
    const salonService = createSalonService(supabase);

    const services = await salonService.getServices(salonId);

    return NextResponse.json({ success: true, data: services });
  } catch (error) {
    console.error("Salon services API error:", error);
    const message = error instanceof Error ? error.message : "서버 오류가 발생했습니다";
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
