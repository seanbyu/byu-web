"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronUp } from "lucide-react";

interface ScrollToTopProps {
  /** Scroll threshold to show button (default: 400px = ~1 viewport) */
  threshold?: number;
  /** Bottom offset to avoid Bottom Navigation (default: 80px) */
  bottomOffset?: number;
  /** Right offset from edge (default: 20px) */
  rightOffset?: number;
}

/**
 * Scroll to Top Button
 *
 * Best Practice:
 * - Appears after scrolling ~1 viewport (400px)
 * - Positioned above Bottom Navigation (80px offset)
 * - Semi-transparent with blur backdrop
 * - Smooth scroll animation
 */
export function ScrollToTop({
  threshold = 400,
  bottomOffset = 80,
  rightOffset = 20,
}: ScrollToTopProps) {
  const [isVisible, setIsVisible] = useState(false);

  // Track scroll position
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsVisible(scrollY > threshold);
    };

    // Check initial position
    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [threshold]);

  // Scroll to top handler
  const scrollToTop = useCallback(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, []);

  if (!isVisible) return null;

  return (
    <button
      onClick={scrollToTop}
      className="fixed z-40 flex items-center justify-center
                 w-11 h-11 rounded-full
                 bg-white/90 backdrop-blur-sm
                 border border-gray-200
                 shadow-lg shadow-black/10
                 text-gray-600 hover:text-gray-900
                 hover:bg-white hover:scale-105
                 active:scale-95
                 transition-all duration-200
                 animate-fade-in"
      style={{
        bottom: `${bottomOffset}px`,
        right: `${rightOffset}px`,
      }}
      aria-label="맨 위로 이동"
    >
      <ChevronUp className="w-5 h-5" />
    </button>
  );
}

export default ScrollToTop;
