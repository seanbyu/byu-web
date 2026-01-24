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

export const bookingsApi = {
  createBooking: (
    salonId: string,
    data: CreateBookingRequest
  ): Promise<ApiResponse<any>> => {
    return apiClient.post(endpoints.salons.bookings.path(salonId), data);
  },
};
