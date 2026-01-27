import { createClient } from "@/lib/supabase/client";
import type { Booking, InsertTables } from "@/lib/supabase/types";

export const createBookingsApi = (client?: ReturnType<typeof createClient>) => {
  const supabase = client ?? createClient();

  return {
    getExistingBookings: async (
      designerId: string,
      bookingDate: string
    ): Promise<Booking[]> => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("designer_id", designerId)
        .eq("booking_date", bookingDate)
        .not("status", "in", '("CANCELLED","NO_SHOW")');

      if (error) throw error;
      return data || [];
    },

    getBookingsBySalon: async (
      salonId: string,
      bookingDate: string
    ): Promise<Booking[]> => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("salon_id", salonId)
        .eq("booking_date", bookingDate)
        .not("status", "in", '("CANCELLED","NO_SHOW")');

      if (error) throw error;
      return data || [];
    },

    createBooking: async (
      bookingData: InsertTables<"bookings">
    ): Promise<Booking> => {
      const { data, error } = await supabase
        .from("bookings")
        .insert(bookingData as never)
        .select()
        .single();

      if (error) throw error;
      return data as Booking;
    },
  };
};
