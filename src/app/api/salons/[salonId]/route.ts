/**
 * Salon Detail API Routes
 * GET /api/salons/[salonId] - 살롱 상세 조회
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createSalonService } from "@/lib/api-core";
import type { SalonIdParams } from "../types";

// GET: 살롱 상세 조회
export async function GET(request: NextRequest, { params }: SalonIdParams) {
  try {
    const { salonId } = await params;
    const supabase = await createClient();
    const salonService = createSalonService(supabase);

    const salon = await salonService.getSalonById(salonId);

    if (!salon) {
      return NextResponse.json(
        { success: false, message: "살롱을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: salon });
  } catch (error) {
    console.error("Salon detail API error:", error);
    const message = error instanceof Error ? error.message : "서버 오류가 발생했습니다";
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
