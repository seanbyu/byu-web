"use client";

import { memo } from "react";
import { useTranslations } from "next-intl";
import { Heart, MapPin, Clock, ChevronRight } from "lucide-react";
import { Link } from "@/i18n/routing";
import { toast } from "sonner";
import { useFavoriteSalons, useToggleSalonFavorite } from "../hooks/useFavoritesQuery";
import { getSalonCoverUrls } from "@/lib/supabase/storage";
import { StorageImage } from "@/components/ui/StorageImage";
import { getSalonStatus, getTodayHours } from "@/features/salons/utils";
import type { Salon } from "@/lib/supabase/types";

// Memoized Salon Card Component
const FavoriteSalonCard = memo(function FavoriteSalonCard({
  salon,
  onRemove,
}: {
  salon: Salon;
  onRemove: (salonId: string) => void;
}) {
  const t = useTranslations("salon");
  const tCommon = useTranslations("common");
  const status = getSalonStatus(salon.business_hours);
  const hours = getTodayHours(salon.business_hours);

  const getBadgeStyle = () => {
    switch (status) {
      case "holiday":
        return { className: "bg-gray-800 text-white", label: tCommon("closed") };
      case "open":
        return { className: "bg-green-500 text-white", label: t("open") };
      case "preparing":
        return { className: "bg-amber-500 text-white", label: t("beforeOpen") };
      case "closed":
        return { className: "bg-gray-500 text-white", label: t("afterClose") };
    }
  };

  const badge = getBadgeStyle();

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onRemove(salon.id);
  };

  return (
    <Link
      href={`/salon/${salon.id}`}
      className="block bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-lg hover:border-primary-100 transition-all duration-200"
    >
      <div className="flex">
        {/* Cover Image */}
        <div className="relative h-24 w-24 flex-shrink-0 bg-gradient-to-br from-primary-100 to-secondary-100 sm:h-28 sm:w-28">
          <StorageImage
            urls={getSalonCoverUrls(salon.id)}
            alt={salon.name}
            className="w-full h-full object-cover"
            fallback={
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-2xl font-bold text-primary-200">
                  {salon.name.charAt(0).toUpperCase()}
                </span>
              </div>
            }
          />
          {/* Status Badge */}
          <div className={`absolute left-1.5 top-1.5 rounded-full px-1.5 py-0.5 text-[11px] font-medium sm:left-2 sm:top-2 sm:px-2 sm:py-1 sm:text-xs ${badge.className}`}>
            {badge.label}
          </div>
        </div>

        {/* Content */}
        <div className="flex min-w-0 flex-1 flex-col justify-between p-2.5 sm:p-3">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900 truncate text-sm">{salon.name}</h3>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={handleRemove}
                  className="touch-target rounded-full p-1 transition-colors hover:bg-gray-100 sm:p-1.5"
                  aria-label="Remove from favorites"
                >
                  <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                </button>
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </div>
            </div>
            {salon.description && (
              <p className="mt-0.5 text-sm text-gray-500 line-clamp-1">
                {salon.description}
              </p>
            )}
          </div>

          <div className="mt-2 flex flex-wrap gap-1.5">
            {salon.address && (
              <div className="flex items-center gap-1 rounded-full bg-gray-50 px-2 py-1 text-xs text-gray-500">
                <MapPin className="w-2.5 h-2.5" />
                <span className="truncate max-w-[80px]">{salon.city || salon.address}</span>
              </div>
            )}
            <div className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs ${
              status === "open" ? "bg-green-50 text-green-600" : "bg-gray-50 text-gray-500"
            }`}>
              <Clock className="w-2.5 h-2.5" />
              <span>{hours || tCommon("closed")}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
});

// Loading Skeleton
function SalonSkeleton() {
  return (
    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden animate-pulse">
      <div className="flex">
        <div className="w-28 h-28 bg-gray-200" />
        <div className="flex-1 p-3 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-200 rounded w-1/2" />
          <div className="flex gap-2 mt-2">
            <div className="h-4 bg-gray-200 rounded w-16" />
            <div className="h-4 bg-gray-200 rounded w-12" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Empty State
function EmptyState() {
  const t = useTranslations("mypick");

  return (
    <div className="flex flex-col items-center justify-center px-4 py-14 sm:py-20">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
        <Heart className="w-8 h-8 text-gray-300" />
      </div>
      <p className="mb-1 text-sm font-medium text-gray-500 sm:text-base">{t("salons.empty")}</p>
      <p className="text-gray-400 text-sm text-center">{t("salons.emptyDescription")}</p>
    </div>
  );
}

export function FavoriteSalonsTab() {
  const tCommon = useTranslations("common");
  const { data: salons, isLoading } = useFavoriteSalons();
  const toggleFavorite = useToggleSalonFavorite();

  const handleRemove = (salonId: string) => {
    // Pass isFavorited: true since we're removing from favorites list
    toggleFavorite.mutate({ salonId, isFavorited: true }, {
      onSuccess: (result) => {
        if (result.success && !result.isFavorited) {
          toast.success(tCommon("favorite.removed"));
        }
      },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-2.5 p-3 sm:space-y-3 sm:p-4">
        {[1, 2, 3].map((i) => (
          <SalonSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!salons || salons.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-2.5 p-3 sm:space-y-3 sm:p-4">
      {salons.map((salon) => (
        <FavoriteSalonCard
          key={salon.id}
          salon={salon}
          onRemove={handleRemove}
        />
      ))}
    </div>
  );
}
