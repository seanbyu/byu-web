/**
 * Home Feature 타입 정의
 */

import type { Salon } from "@/lib/supabase/types";

// ============================================
// View Props
// ============================================

export type HomeViewProps = {
  salons: Salon[];
};

// ============================================
// Component Props
// ============================================

export type SalonListProps = {
  salons: Salon[];
};

export type SalonCardProps = {
  salon: Salon;
};

export type HeroBannerProps = {
  banners: { id: string; imageUrl: string; link: string }[];
};
