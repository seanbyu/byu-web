import { useState } from "react";

interface HeroBannerProps {
  banners: { id: string; imageUrl: string; link: string }[];
}

export function HeroBanner({ banners }: HeroBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Fallback if no banners
  if (!banners || banners.length === 0) {
    return (
      <div className="relative w-full aspect-[4/3] bg-gray-200 animate-pulse flex items-center justify-center">
        <span className="text-gray-400 text-sm">Banner Area</span>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-[4/3] overflow-hidden">
      {/* TODO: Implement Carousel Logic */}
      <img
        src={banners[currentIndex].imageUrl}
        alt="Banner"
        className="w-full h-full object-cover"
      />
      <div className="absolute bottom-4 right-4 bg-black/40 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
        {currentIndex + 1} / {banners.length}
      </div>
    </div>
  );
}
