import { HomeView } from "@/features/home/views/HomeView";

export default function Home() {
  return (
    // Desktop wrapper: gray background, centered
    <div className="min-h-screen bg-gray-50 flex justify-center text-gray-900">
      {/* Mobile container: white, shadow, max-width */}
      <main className="w-full max-w-[448px] min-h-screen bg-white shadow-xl relative">
        <HomeView />
      </main>
    </div>
  );
}
