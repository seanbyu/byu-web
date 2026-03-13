import { Suspense } from "react";
import { BookingHistoryView } from "@/features/bookings/views/BookingHistoryView";

export default function BookingsPage() {
  return (
    <Suspense>
      <BookingHistoryView />
    </Suspense>
  );
}
