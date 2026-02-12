/**
 * Test Customers Table API
 * GET /api/test-customers - customers 테이블 확인
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
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

    // customers 테이블 조회 테스트
    const { data, error, count } = await supabase
      .from("customers")
      .select("*", { count: "exact" })
      .limit(5);

    if (error) {
      console.error("Customers table error:", error);
      return NextResponse.json({
        success: false,
        message: "customers 테이블 조회 실패",
        error: error.message,
        code: error.code,
        details: error.details,
      });
    }

    return NextResponse.json({
      success: true,
      message: "customers 테이블이 존재하고 접근 가능합니다",
      count,
      sample: data,
    });
  } catch (error) {
    console.error("Test customers error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "서버 오류",
      },
      { status: 500 }
    );
  }
}
