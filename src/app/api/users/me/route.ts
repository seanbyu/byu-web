/**
 * User Profile API Routes
 * GET /api/users/me - 현재 로그인한 사용자 프로필 조회
 * PATCH /api/users/me - 현재 로그인한 사용자 프로필 수정 (phone)
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

type UpdateUserProfileBody = {
  phone?: string | null;
};

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

    // users 행 조회 (트리거가 생성했어야 하지만, DB reset 후에는 없을 수 있음)
    let { data: userData, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", authUser.id)
      .single();

    // 행이 없으면 삽입 (기존 데이터는 절대 덮어쓰지 않음)
    if (userError?.code === "PGRST116" || !userData) {
      const { data: newUser, error: insertError } = await supabase
        .from("users")
        .insert({
          id: authUser.id,
          email: authUser.email ?? null,
          name: authUser.user_metadata?.name ?? authUser.user_metadata?.full_name ?? authUser.email?.split("@")[0] ?? "User",
          user_type: "CUSTOMER" as const,
          role: "CUSTOMER" as const,
          profile_image: authUser.user_metadata?.avatar_url ?? null,
        })
        .select("*")
        .single();

      if (insertError) throw insertError;
      userData = newUser;
    } else if (userError) {
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

// PATCH: 현재 사용자 프로필 수정 (phone)
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();

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

    const body = (await request.json()) as UpdateUserProfileBody;
    const rawPhone = typeof body.phone === "string" ? body.phone.trim() : "";
    const normalizedPhone = rawPhone === "" ? null : rawPhone.replace(/\s+/g, " ");

    if (normalizedPhone && !/^[0-9+\-() ]{8,20}$/.test(normalizedPhone)) {
      return NextResponse.json(
        { success: false, message: "유효한 휴대폰 번호를 입력해주세요" },
        { status: 400 }
      );
    }

    // phone만 업데이트 (다른 필드 덮어쓰기 금지)
    let { data: updatedUser, error: updateError } = await supabase
      .from("users")
      .update({ phone: normalizedPhone })
      .eq("id", authUser.id)
      .select("*")
      .single();

    // 행이 없으면 삽입 후 반환 (DB reset 시나리오)
    if (updateError?.code === "PGRST116" || !updatedUser) {
      const { data: newUser, error: insertError } = await supabase
        .from("users")
        .insert({
          id: authUser.id,
          email: authUser.email ?? null,
          name: authUser.user_metadata?.name ?? authUser.user_metadata?.full_name ?? authUser.email?.split("@")[0] ?? "User",
          user_type: "CUSTOMER" as const,
          role: "CUSTOMER" as const,
          profile_image: authUser.user_metadata?.avatar_url ?? null,
          phone: normalizedPhone,
        })
        .select("*")
        .single();

      if (insertError) throw insertError;
      updatedUser = newUser;
    } else if (updateError) {
      throw updateError;
    }

    // Keep auth metadata in sync (used in booking flow)
    const { error: metadataError } = await supabase.auth.updateUser({
      data: {
        phone: normalizedPhone,
      },
    });

    if (metadataError) {
      console.error("Failed to sync auth metadata phone:", metadataError);
    }

    const { data: identities, error: identitiesError } = await supabase
      .from("user_identities")
      .select("id, provider, provider_user_id, profile, is_primary")
      .eq("user_id", authUser.id)
      .order("is_primary", { ascending: false });

    if (identitiesError) {
      console.error("Failed to fetch identities:", identitiesError);
    }

    return NextResponse.json({
      success: true,
      data: {
        ...updatedUser,
        user_identities: identities || [],
      },
      message: "휴대폰 번호가 저장되었습니다",
    });
  } catch (error) {
    console.error("User profile update API error:", error);
    const message = error instanceof Error ? error.message : "서버 오류가 발생했습니다";

    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
