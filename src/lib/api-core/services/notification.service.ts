/**
 * Notification Service
 * 알림 생성 및 관리 비즈니스 로직
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/supabase/types";

type NotificationChannel = Database["public"]["Enums"]["notification_channel"];
type NotificationType = Database["public"]["Enums"]["notification_type"];
type RecipientType = Database["public"]["Enums"]["recipient_type"];

interface CreateNotificationParams {
  bookingId: string;
  salonId: string;
  channel: NotificationChannel;
  notificationType: NotificationType;
  recipientType: RecipientType;
  recipientCustomerId?: string;
  recipientUserId?: string;
  title: string;
  body: string;
  metadata?: Record<string, Json | undefined>;
}

export class NotificationService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * 예약 알림 생성
   */
  async createBookingNotification(params: CreateNotificationParams): Promise<string> {
    const { data, error } = await this.supabase
      .from("notifications")
      .insert({
        booking_id: params.bookingId,
        salon_id: params.salonId,
        channel: params.channel,
        notification_type: params.notificationType,
        recipient_type: params.recipientType,
        recipient_customer_id: params.recipientCustomerId || null,
        recipient_user_id: params.recipientUserId || null,
        title: params.title || null,
        body: params.body,
        metadata: params.metadata || null,
        status: "PENDING",
      })
      .select("id")
      .single();

    if (error) {
      console.error("Failed to create notification:", error);
      throw error;
    }

    return data.id;
  }

  /**
   * 새 예약에 대한 알림을 생성합니다 (고객, 아티스트, 관리자)
   */
  async createNewBookingNotifications(params: {
    bookingId: string;
    salonId: string;
    salonName: string;
    customerId: string;
    customerName: string;
    artistId: string;
    artistName: string;
    bookingDate: string;
    startTime: string;
    serviceName?: string;
  }): Promise<void> {
    const { bookingId, salonId, salonName, customerId, customerName, artistId, artistName, bookingDate, startTime } = params;

    const formattedDate = new Date(bookingDate).toLocaleDateString("ko-KR", {
      month: "long",
      day: "numeric",
      weekday: "short",
    });

    try {
      // 1. 고객에게 알림 (LINE + 인앱)
      const customerTitle = "예약이 접수되었습니다";
      const customerBody = `${formattedDate} ${startTime}에 ${salonName}에서 ${artistName}님과의 예약이 접수되었습니다. 확정되면 알려드리겠습니다.`;

      await Promise.all([
        // LINE 알림
        this.createBookingNotification({
          bookingId,
          salonId,
          channel: "LINE",
          notificationType: "BOOKING_REQUEST",
          recipientType: "CUSTOMER",
          recipientCustomerId: customerId,
          title: customerTitle,
          body: customerBody,
        }),
        // 인앱 알림
        this.createBookingNotification({
          bookingId,
          salonId,
          channel: "IN_APP",
          notificationType: "BOOKING_REQUEST",
          recipientType: "CUSTOMER",
          recipientCustomerId: customerId,
          title: customerTitle,
          body: customerBody,
        }),
      ]);

      // 2. 아티스트에게 알림 (LINE + 인앱)
      const artistTitle = "새 예약 요청";
      const artistBody = `${formattedDate} ${startTime}에 ${customerName}님의 새 예약 요청이 있습니다.`;

      await Promise.all([
        // LINE 알림
        this.createBookingNotification({
          bookingId,
          salonId,
          channel: "LINE",
          notificationType: "BOOKING_REQUEST",
          recipientType: "ARTIST",
          recipientUserId: artistId,
          title: artistTitle,
          body: artistBody,
        }),
        // 인앱 알림
        this.createBookingNotification({
          bookingId,
          salonId,
          channel: "IN_APP",
          notificationType: "BOOKING_REQUEST",
          recipientType: "ARTIST",
          recipientUserId: artistId,
          title: artistTitle,
          body: artistBody,
        }),
      ]);

      // 3. 어드민 알림은 Postgres 트리거(trg_booking_inserted)가 원자적으로 처리
      //    여기서 생성하면 중복 발생 → 제거

      console.log(`✅ Notifications created for booking ${bookingId}`);
    } catch (error) {
      console.error("Error creating booking notifications:", error);
      // 알림 생성 실패는 예약 자체를 실패시키지 않음
    }
  }

  /**
   * 예약 변경 시 알림 생성 (아티스트 + 관리자)
   * 고객이 직접 변경한 경우이므로 고객에게는 알림을 보내지 않음
   */
  async createRescheduleNotifications(params: {
    bookingId: string;
    salonId: string;
    customerName: string;
    artistId: string;
    artistName: string;
    newBookingDate: string;
    newStartTime: string;
    serviceName?: string;
  }): Promise<void> {
    const { bookingId, salonId, customerName, artistId, newBookingDate, newStartTime } = params;

    const formattedDate = new Date(newBookingDate).toLocaleDateString("ko-KR", {
      month: "long",
      day: "numeric",
      weekday: "short",
    });

    try {
      // 1. 아티스트에게 알림 (IN_APP)
      const artistTitle = "예약 일정 변경";
      const artistBody = `${customerName}님의 예약이 ${formattedDate} ${newStartTime}으로 변경되었습니다.`;

      await this.createBookingNotification({
        bookingId,
        salonId,
        channel: "IN_APP",
        notificationType: "BOOKING_MODIFIED",
        recipientType: "ARTIST",
        recipientUserId: artistId,
        title: artistTitle,
        body: artistBody,
      });

      // 2. 어드민 알림은 Postgres 트리거(trg_booking_rescheduled)가 원자적으로 처리
      //    여기서 생성하면 중복 발생 → 제거

      console.log(`✅ Reschedule notifications created for booking ${bookingId}`);
    } catch (error) {
      console.error("Error creating reschedule notifications:", error);
    }
  }

}

/**
 * Service 인스턴스 생성 헬퍼
 */
export const createNotificationService = (supabase: SupabaseClient<Database>) => {
  return new NotificationService(supabase);
};
