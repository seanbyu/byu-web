import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getSalonWithStaff } from "@/features/salons/queries";
import { SalonDetailView } from "@/features/salons/views/SalonDetailView";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

async function SalonDetailData({ id }: { id: string }) {
  const { salon, staff } = await getSalonWithStaff(id);

  if (!salon) {
    notFound();
  }

  return <SalonDetailView salon={salon} staff={staff} />;
}

function DetailLoading() {
  return (
    <div className="app-page-bleed bg-white animate-pulse">
      {/* Header skeleton */}
      <div className="h-14 bg-gray-100" />
      {/* Image skeleton */}
      <div className="h-72 bg-gray-200" />
      {/* Content skeleton */}
      <div className="p-4 space-y-4">
        <div className="h-6 bg-gray-100 w-2/3 rounded" />
        <div className="h-4 bg-gray-100 w-full rounded" />
        <div className="h-4 bg-gray-100 w-3/4 rounded" />
        <div className="h-32 bg-gray-100 rounded-xl mt-6" />
        <div className="h-32 bg-gray-100 rounded-xl" />
      </div>
    </div>
  );
}

export default async function SalonDetailPage({ params }: Props) {
  const { id } = await params;

  return (
    <Suspense fallback={<DetailLoading />}>
      <SalonDetailData id={id} />
    </Suspense>
  );
}
