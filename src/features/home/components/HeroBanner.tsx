"use client";

import { memo, useEffect } from "react";
import { useShallow } from "zustand/react/shallow";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useHomeStore } from "../stores/useHomeStore";
import type { HeroBannerProps } from "../types";

export const HeroBanner = memo(function HeroBanner({ banners }: HeroBannerProps) {
  const { currentBannerIndex, setCurrentBannerIndex, nextBanner, prevBanner } = useHomeStore(
    useShallow((state) => ({
      currentBannerIndex: state.currentBannerIndex,
      setCurrentBannerIndex: state.setCurrentBannerIndex,
      nextBanner: state.nextBanner,
      prevBanner: state.prevBanner,
    }))
  );

  // Auto-slide every 5 seconds
  useEffect(() => {
    if (banners.length <= 1) return;

    const interval = setInterval(() => {
      nextBanner(banners.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [banners.length, nextBanner]);

  // Fallback if no banners
  if (!banners || banners.length === 0) {
    return (
      <div className="relative w-full aspect-[4/3] bg-gray-200 animate-pulse flex items-center justify-center">
        <span className="text-gray-400 text-sm">Banner Area</span>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-[4/3] overflow-hidden group">
      {/* Banner Image */}
      <img
        src={banners[currentBannerIndex].imageUrl}
        alt="Banner"
        className="w-full h-full object-cover transition-opacity duration-300"
      />

      {/* Navigation Arrows (visible on hover) */}
      {banners.length > 1 && (
        <>
          <button
            onClick={() => prevBanner(banners.length)}
            className="touch-target absolute left-2 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white opacity-100 transition hover:bg-black/50 md:opacity-0 md:group-hover:opacity-100"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => nextBanner(banners.length)}
            className="touch-target absolute right-2 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white opacity-100 transition hover:bg-black/50 md:opacity-0 md:group-hover:opacity-100"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Indicator */}
      <div className="absolute bottom-4 right-4 bg-black/40 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
        {currentBannerIndex + 1} / {banners.length}
      </div>

      {/* Dots indicator */}
      {banners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentBannerIndex(index)}
              className="touch-target flex items-center justify-center"
            >
              <span
                className={`h-2.5 w-2.5 rounded-full transition-colors ${
                  index === currentBannerIndex ? "bg-white" : "bg-white/50"
                }`}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
});
