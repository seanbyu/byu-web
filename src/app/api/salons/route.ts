/**
 * Salons API Routes
 * GET /api/salons - 모든 살롱 조회
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createSalonService } from "@/lib/api-core";

// GET: 모든 활성 살롱 조회
export async function GET() {
  try {
    const supabase = await createClient();
    const salonService = createSalonService(supabase);

    const salons = await salonService.getAllSalons();

    return NextResponse.json({ success: true, data: salons });
  } catch (error) {
    console.error("Salons API error:", error);
    const message = error instanceof Error ? error.message : "서버 오류가 발생했습니다";
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
