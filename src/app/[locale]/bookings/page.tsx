import { BookingsView } from "@/features/bookings/views/BookingsView";

export default function BookingsPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex justify-center text-gray-900">
      <main className="w-full max-w-[448px] min-h-screen bg-white shadow-xl relative">
        <BookingsView />
      </main>
    </div>
  );
}
