/**
 * User Profile API Routes
 * GET /api/users/me - 현재 로그인한 사용자 프로필 조회
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Type for user identity (LINE, Google, Kakao, etc.)
interface UserIdentity {
  id: string;
  provider: string;
  provider_user_id: string | null;
  profile: {
    displayName?: string;
    pictureUrl?: string;
    statusMessage?: string;
    lineUserId?: string;
  } | null;
  is_primary: boolean;
}

// GET: 현재 사용자 프로필 조회
export async function GET() {
  try {
    const supabase = await createClient();

    // 인증 확인
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json(
        { success: false, message: "인증되지 않은 사용자입니다" },
        { status: 401 }
      );
    }

    // Fetch user with their linked identities
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", authUser.id)
      .single();

    if (userError) {
      throw userError;
    }

    // Fetch user identities (LINE, Google, Kakao, etc.)
    const { data: identities, error: identitiesError } = await supabase
      .from("user_identities")
      .select("id, provider, provider_user_id, profile, is_primary")
      .eq("user_id", authUser.id)
      .order("is_primary", { ascending: false });

    if (identitiesError) {
      console.error("Failed to fetch identities:", identitiesError);
      // Continue without identities if there's an error
    }

    return NextResponse.json({
      success: true,
      data: {
        ...userData,
        user_identities: identities || [],
      },
    });
  } catch (error) {
    console.error("User profile API error:", error);
    const message = error instanceof Error ? error.message : "서버 오류가 발생했습니다";

    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
