/**
 * LINE Service
 * LINE Messaging API 연동 서비스
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export interface LineFriendStatus {
  isFriend: boolean;
  lineUserId: string | null;
  salonHasLine: boolean;
}

export class LineService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * 유저가 살롱의 LINE 공식계정을 친구추가했는지 확인
   *
   * 1. salon_line_settings에서 access_token 조회
   * 2. lineUserId로 LINE Messaging API 프로필 조회 → 200이면 친구
   */
  async checkFriendship(
    salonId: string,
    lineUserId: string | null
  ): Promise<LineFriendStatus> {
    // 1. 살롱의 LINE 설정 조회
    const { data: lineSettings } = await this.supabase
      .from("salon_line_settings")
      .select("line_channel_access_token, is_active, is_verified")
      .eq("salon_id", salonId)
      .maybeSingle();

    if (
      !lineSettings?.line_channel_access_token ||
      !lineSettings.is_active ||
      !lineSettings.is_verified
    ) {
      return { isFriend: false, lineUserId: null, salonHasLine: false };
    }

    if (!lineUserId) {
      return { isFriend: false, lineUserId: null, salonHasLine: true };
    }

    // 2. LINE Messaging API로 친구 여부 확인
    try {
      const response = await fetch(
        `https://api.line.me/v2/bot/profile/${lineUserId}`,
        {
          headers: {
            Authorization: `Bearer ${lineSettings.line_channel_access_token}`,
          },
        }
      );

      return {
        isFriend: response.ok, // 200 = 친구, 404 = 아님
        lineUserId,
        salonHasLine: true,
      };
    } catch {
      // LINE API 호출 실패 시 확인 불가 → false
      return { isFriend: false, lineUserId, salonHasLine: true };
    }
  }
}

export const createLineService = (supabase: SupabaseClient<Database>) => {
  return new LineService(supabase);
};
