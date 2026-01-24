import { Suspense } from "react";
import { HomeView } from "@/features/home/views/HomeView";
import { getSalons } from "@/features/salons/queries";

// Server component for data fetching
async function SalonData() {
  const salons = await getSalons();
  return <HomeView salons={salons} />;
}

// Loading skeleton
function HomeLoading() {
  return (
    <div className="bg-white min-h-screen pb-20 animate-pulse">
      <div className="h-14 bg-gray-100" />
      <div className="h-48 bg-gray-200 mx-4 mt-4 rounded-xl" />
      <div className="grid grid-cols-4 gap-4 p-4 mt-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 rounded-lg" />
        ))}
      </div>
      <div className="h-6 bg-gray-100 mx-4 mt-4 w-32" />
      <div className="flex gap-4 p-4 overflow-hidden">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="w-40 h-48 bg-gray-100 rounded-xl flex-shrink-0" />
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex justify-center text-gray-900">
      <main className="w-full max-w-[448px] min-h-screen bg-white shadow-xl relative">
        {/* Suspense boundary for streaming (async-suspense-boundaries) */}
        <Suspense fallback={<HomeLoading />}>
          <SalonData />
        </Suspense>
      </main>
    </div>
  );
}
