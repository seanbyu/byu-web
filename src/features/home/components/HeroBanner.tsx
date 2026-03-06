"use client";

import { memo, useEffect, useRef, useState } from "react";
import type { HeroBannerProps } from "../types";

const SWIPE_THRESHOLD = 50; // px

export const HeroBanner = memo(function HeroBanner({ banners }: HeroBannerProps) {
  const [displayIndex, setDisplayIndex] = useState(0);
  const isResetting = useRef(false);
  const displayIndexRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const cloned = banners.length > 1 ? [...banners, banners[0]] : banners;
  const realIndex = displayIndex % banners.length;

  const goNextRef = useRef<() => void>(() => {});
  const goPrevRef = useRef<() => void>(() => {});
  const autoSlideInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopAutoSlide = () => {
    if (autoSlideInterval.current) {
      clearInterval(autoSlideInterval.current);
      autoSlideInterval.current = null;
    }
  };

  const startAutoSlide = () => {
    if (banners.length <= 1) return;
    stopAutoSlide();
    autoSlideInterval.current = setInterval(() => goNextRef.current(), 5000);
  };

  // ── 트랙 DOM 직접 조작 유틸 ──────────────────────────────
  const setTrackTransform = (indexOffset: number, dragPx = 0, withTransition = false) => {
    const el = trackRef.current;
    if (!el) return;
    el.style.transition = withTransition ? "transform 300ms ease-in-out" : "none";
    el.style.transform = `translateX(calc(-${indexOffset * 100}% + ${dragPx}px))`;
  };

  // ── 슬라이드 이동 ──────────────────────────────────────
  const snapTo = (index: number) => {
    displayIndexRef.current = index;
    setDisplayIndex(index);
    setTrackTransform(index, 0, true);
  };

  const goNext = () => {
    if (isResetting.current) return;
    const next = displayIndexRef.current + 1;
    displayIndexRef.current = next;
    setDisplayIndex(next);
    setTrackTransform(next, 0, true);
  };

  const goPrev = () => {
    if (isResetting.current) return;
    const next = displayIndexRef.current === 0 ? banners.length - 1 : displayIndexRef.current - 1;
    displayIndexRef.current = next;
    setDisplayIndex(next);
    setTrackTransform(next, 0, true);
  };

  const goTo = (index: number) => {
    displayIndexRef.current = index;
    setDisplayIndex(index);
    setTrackTransform(index, 0, true);
  };

  goNextRef.current = goNext;
  goPrevRef.current = goPrev;

  // ── 클론 스냅 처리 ─────────────────────────────────────
  const handleTransitionEnd = (e: React.TransitionEvent<HTMLDivElement>) => {
    if (e.propertyName !== "transform") return;
    if (displayIndexRef.current === banners.length) {
      isResetting.current = true;
      displayIndexRef.current = 0;
      setDisplayIndex(0);
      setTrackTransform(0, 0, false); // transition 없이 즉시 스냅
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          isResetting.current = false;
        });
      });
    }
  };

  // ── 마우스 드래그 — 실시간 추적 ───────────────────────
  const dragStartX = useRef<number | null>(null);

  const onMouseDown = (e: React.MouseEvent) => {
    if (isResetting.current) return;
    stopAutoSlide();
    dragStartX.current = e.clientX;
    if (trackRef.current) trackRef.current.style.transition = "none";
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (dragStartX.current === null) return;
    const delta = e.clientX - dragStartX.current;
    setTrackTransform(displayIndexRef.current, delta, false);
  };

  const onMouseUp = (e: React.MouseEvent) => {
    if (dragStartX.current === null) return;
    const delta = e.clientX - dragStartX.current;
    dragStartX.current = null;
    if (delta < -SWIPE_THRESHOLD) goNext();
    else if (delta > SWIPE_THRESHOLD) goPrev();
    else snapTo(displayIndexRef.current);
    startAutoSlide();
  };

  const onMouseLeave = (e: React.MouseEvent) => {
    if (dragStartX.current === null) return;
    const delta = e.clientX - (dragStartX.current ?? e.clientX);
    dragStartX.current = null;
    if (delta < -SWIPE_THRESHOLD) goNext();
    else if (delta > SWIPE_THRESHOLD) goPrev();
    else snapTo(displayIndexRef.current);
    startAutoSlide();
  };

  // ── 터치 스와이프 — non-passive, 실시간 추적 ─────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el || banners.length <= 1) return;

    let startX = 0;
    let startY = 0;
    let isHorizontal: boolean | null = null;
    let localDelta = 0;
    let touching = false;

    const onTouchStart = (e: TouchEvent) => {
      stopAutoSlide();
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      isHorizontal = null;
      localDelta = 0;
      touching = true;
      if (trackRef.current) trackRef.current.style.transition = "none";
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!touching) return;
      const dx = e.touches[0].clientX - startX;
      const dy = e.touches[0].clientY - startY;

      if (isHorizontal === null) {
        isHorizontal = Math.abs(dx) > Math.abs(dy);
      }

      if (isHorizontal) {
        e.preventDefault();
        localDelta = dx;
        // 실시간으로 이미지 따라오기
        setTrackTransform(displayIndexRef.current, localDelta, false);
      } else {
        touching = false;
      }
    };

    const onTouchEnd = () => {
      if (!touching) return;
      touching = false;
      if (localDelta < -SWIPE_THRESHOLD) goNextRef.current();
      else if (localDelta > SWIPE_THRESHOLD) goPrevRef.current();
      else setTrackTransform(displayIndexRef.current, 0, true); // 제자리 복귀
      localDelta = 0;
      startAutoSlide();
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [banners.length]);

  // 자동 슬라이드 초기화 — 마운트 시 시작, 언마운트 시 정리
  useEffect(() => {
    startAutoSlide();
    return () => stopAutoSlide();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [banners.length]);

  // 마운트 시 초기 위치만 설정 — 이후 transform은 goNext/goPrev/goTo/snapTo에서만 직접 제어
  useEffect(() => {
    setTrackTransform(0, 0, false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!banners || banners.length === 0) {
    return (
      <div className="relative w-full aspect-[16/9] bg-gray-200 animate-pulse flex items-center justify-center sm:aspect-[16/9]">
        <span className="text-gray-400 text-sm">Banner Area</span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-[16/9] overflow-hidden group sm:aspect-[16/9] cursor-grab active:cursor-grabbing select-none"
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
    >
      {/* Sliding Track */}
      <div
        ref={trackRef}
        className="flex h-full"
        style={{ willChange: "transform" }}
        onTransitionEnd={handleTransitionEnd}
      >
        {cloned.map((banner, i) => (
          <img
            key={`${banner.id}-${i}`}
            src={banner.imageUrl}
            alt="Banner"
            className="w-full h-full flex-shrink-0 object-cover"
            loading="eager"
            draggable={false}
          />
        ))}
      </div>


      {/* Indicator */}
      <div className="absolute bottom-4 right-4 bg-black/40 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
        {realIndex + 1} / {banners.length}
      </div>

      {/* Dots */}
      {banners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => goTo(index)}
              className="touch-target flex items-center justify-center"
            >
              <span
                className={`h-2.5 w-2.5 rounded-full transition-colors ${
                  index === realIndex ? "bg-white" : "bg-white/50"
                }`}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
});
