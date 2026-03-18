"use client";

import { memo, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { MapPin, Clock, Phone, ChevronRight, Heart } from "lucide-react";
import { Link } from "@/i18n/routing";
import { toast } from "sonner";
import { getSalonCoverUrls } from "@/lib/supabase/storage";
import { StorageImage } from "@/components/ui/StorageImage";
import { SalonCardSkeleton } from "@/components/ui/Skeleton";
import { getSalonStatus, getTodayHours } from "@/features/salons/utils";
import { useFavorites } from "@/features/favorites";
import { useAuthContext } from "@/features/auth";
import { LoginModal } from "@/features/auth/components/LoginModal";
import type { SalonListProps, SalonCardProps } from "../types";

// 언어 코드를 국기 이모지로 변환
const languageToFlag: Record<string, string> = {
  ko: "🇰🇷",
  en: "🇺🇸",
  th: "🇹🇭",
  ja: "🇯🇵",
  zh: "🇨🇳",
  vi: "🇻🇳",
};

interface SalonCardWithFavoriteProps extends SalonCardProps {
  isFavorited: boolean;
  onToggleFavorite: (salonId: string) => void;
  priority?: boolean;
}

const SalonCard = memo(function SalonCard({
  salon,
  isFavorited,
  onToggleFavorite,
  priority,
}: SalonCardWithFavoriteProps) {
  const t = useTranslations("salon");
  const tCommon = useTranslations("common");
  const status = getSalonStatus(salon.business_hours);
  const hours = getTodayHours(salon.business_hours);
  const [imageLoaded, setImageLoaded] = useState(false);

  // 배지 상태: 휴무 > 영업 중 > 준비 중 > 영업 종료
  const getBadgeStyle = () => {
    switch (status) {
      case "holiday":
        return { className: "bg-gray-800 text-white", label: tCommon("closed") }; // 휴무
      case "open":
        return { className: "bg-green-500 text-white", label: t("open") }; // 영업 중
      case "preparing":
        return { className: "bg-amber-500 text-white", label: t("beforeOpen") }; // 준비 중
      case "closed":
        return { className: "bg-gray-500 text-white", label: t("afterClose") }; // 영업 종료
    }
  };

  const badge = getBadgeStyle();

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleFavorite(salon.id);
  };

  return (
    <div className="relative">
      {!imageLoaded && (
        <div className="absolute inset-0 z-10 rounded-xl overflow-hidden">
          <SalonCardSkeleton />
        </div>
      )}
      <Link
        href={`/salon/${salon.id}`}
        className={`block bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-lg hover:border-primary-100 transition-all duration-200 active:scale-[0.99] ${!imageLoaded ? "opacity-0 pointer-events-none" : "opacity-100"}`}
      >
      {/* Cover Image */}
      <div className="relative h-28 bg-gradient-to-br from-primary-100 to-secondary-100 sm:h-32">
        <StorageImage
          urls={getSalonCoverUrls(salon.id, salon.cover_image_url)}
          alt={salon.name}
          className="object-cover"
          priority={priority}
          onLoad={() => setImageLoaded(true)}
          fallback={
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-3xl font-bold text-primary-200">
                {salon.name.charAt(0).toUpperCase()}
              </span>
            </div>
          }
        />
        {/* Status Badge */}
        <div className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-[11px] font-medium shadow-sm sm:right-3 sm:top-3 sm:px-2.5 sm:py-1 sm:text-xs ${badge.className}`}>
          {badge.label}
        </div>
        {/* Plan Badge */}
        {salon.plan_type !== "FREE" && (
          <div className="absolute left-2 top-2 rounded-full bg-primary-600 px-2 py-0.5 text-[11px] font-medium text-white shadow-sm sm:left-3 sm:top-3 sm:py-1 sm:text-xs">
            {salon.plan_type}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-2.5 sm:p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <h3 className="truncate text-sm font-bold text-gray-900 sm:text-base">{salon.name}</h3>
            {/* 통역 가능 매장 */}
            {(() => {
              const s = salon.settings as Record<string, unknown> | null;
              const langs = s?.interpreter_enabled ? (s.supported_languages as string[] | undefined) : undefined;
              if (!langs || langs.length === 0) return null;
              return (
                <div className="flex items-center gap-1.5 flex-shrink-0 text-gray-500">
                  <span className="text-gray-300">|</span>
                  <span className="text-sm leading-none">
                    {langs.map((lang) => (
                      <span key={lang}>{languageToFlag[lang] || lang}</span>
                    ))}
                  </span>
                  <span className="hidden text-xs sm:inline">({t("interpreterAvailable")})</span>
                </div>
              );
            })()}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Favorite Button */}
            <button
              onClick={handleFavoriteClick}
              className="touch-target rounded-full p-1.5 transition-colors hover:bg-gray-100 sm:p-2"
              aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
            >
              <Heart
                className={`w-5 h-5 transition-colors ${
                  isFavorited
                    ? "fill-red-500 text-red-500"
                    : "text-gray-300 hover:text-red-400"
                }`}
              />
            </button>
            <ChevronRight className="w-5 h-5 text-gray-300" />
          </div>
        </div>
        {salon.description && (
          <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">
            {salon.description}
          </p>
        )}

        <div className="mt-2 flex flex-wrap gap-1.5">
          {salon.address && (
            <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
              <MapPin className="w-3 h-3" />
              <span className="truncate max-w-[120px]">{salon.city || salon.address}</span>
            </div>
          )}
          <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
            status === "holiday" ? "bg-gray-100 text-gray-500" : status === "open" ? "bg-green-50 text-green-600" : "bg-gray-50 text-gray-500"
          }`}>
            <Clock className="w-3 h-3" />
            <span>{hours || tCommon("closed")}</span>
          </div>
        </div>

        {salon.phone && (
          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-gray-500">
            <Phone className="w-3 h-3" />
            <span>{salon.phone}</span>
          </div>
        )}
      </div>
      </Link>
    </div>
  );
});

export const SalonList = memo(function SalonList({ salons }: SalonListProps) {
  const t = useTranslations("salon");
  const tCommon = useTranslations("common");
  const { isAuthenticated } = useAuthContext();
  const { isSalonFavorited, toggleSalonFavorite } = useFavorites();
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleToggleFavorite = useCallback(async (salonId: string) => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    const result = await toggleSalonFavorite(salonId);
    if (result.success) {
      if (result.isFavorited) {
        toast.success(tCommon("favorite.added"));
      } else {
        toast.success(tCommon("favorite.removed"));
      }
    }
  }, [isAuthenticated, toggleSalonFavorite, tCommon]);

  if (salons.length === 0) {
    return (
      <div className="p-3 sm:p-4">
        <h2 className="mb-3 text-base font-bold text-gray-900 sm:mb-4 sm:text-lg">{t("title")}</h2>
        <div className="text-center py-8 text-gray-400">
          {t("noSalons")}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-3 sm:p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-900 sm:text-base">{t("title")}</h2>
          <span className="text-xs text-gray-500">{salons.length}개</span>
        </div>
        <div className="space-y-2.5 sm:space-y-3">
          {salons.map((salon, index) => (
            <SalonCard
              key={salon.id}
              salon={salon}
              isFavorited={isSalonFavorited(salon.id)}
              onToggleFavorite={handleToggleFavorite}
              priority={index === 0}
            />
          ))}
        </div>
      </div>

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        titleKey="loginRequired"
        descriptionKey="loginRequiredDesc"
      />
    </>
  );
});
