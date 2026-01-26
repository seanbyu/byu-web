import { apiClient } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { ApiResponse } from "@/types";

export interface CreateBookingRequest {
  salonId: string;
  serviceId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  customerName: string;
  customerPhone: string;
}

// 예약 생성 응답 타입
export interface CreateBookingResponse {
  id: string;
  salonId: string;
  serviceId: string;
  date: string;
  time: string;
  customerName: string;
  customerPhone: string;
  status: string;
  createdAt: string;
}

export const bookingsApi = {
  createBooking: (
    salonId: string,
    data: CreateBookingRequest
  ): Promise<ApiResponse<CreateBookingResponse>> => {
    return apiClient.post<CreateBookingResponse>(
      endpoints.salons.bookings.path(salonId),
      data
    );
  },
};
