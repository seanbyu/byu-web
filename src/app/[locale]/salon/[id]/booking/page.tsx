import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getSalonBookingData } from "@/features/salons/queries";
import { BookingView } from "@/features/bookings/views/BookingView";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

async function BookingData({ id }: { id: string }) {
  const { salon, staff, services, categories } = await getSalonBookingData(id);

  if (!salon) {
    notFound();
  }

  return (
    <BookingView
      salon={salon}
      staff={staff}
      services={services}
      categories={categories}
    />
  );
}

function BookingLoading() {
  return (
    <div className="app-page-tight bg-white animate-pulse">
      {/* Header skeleton */}
      <div className="h-14 bg-gray-100" />
      {/* Content skeleton */}
      <div className="p-4 space-y-4">
        <div className="h-6 bg-gray-100 w-1/2 rounded" />
        <div className="h-4 bg-gray-100 w-full rounded" />
        <div className="space-y-3 mt-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function SalonBookingPage({ params }: Props) {
  const { id } = await params;

  return (
    <Suspense fallback={<BookingLoading />}>
      <BookingData id={id} />
    </Suspense>
  );
}
