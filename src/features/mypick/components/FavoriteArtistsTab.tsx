"use client";

import { memo } from "react";
import { useTranslations } from "next-intl";
import { User, Heart, ChevronRight } from "lucide-react";
import { Link } from "@/i18n/routing";
import { toast } from "sonner";
import { useFavoriteArtists, useToggleArtistFavorite } from "../hooks/useFavoritesQuery";
import type { StaffWithProfile } from "@/lib/supabase/types";

// Memoized Artist Card Component
const FavoriteArtistCard = memo(function FavoriteArtistCard({
  artist,
  onRemove,
}: {
  artist: StaffWithProfile;
  onRemove: (artistId: string) => void;
}) {
  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onRemove(artist.id);
  };

  // Get salon_id from staff_profiles
  const salonId = artist.staff_profiles?.salon_id;

  // If no salon_id, render non-clickable card
  if (!salonId) {
    return (
      <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm sm:p-4">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200 sm:h-14 sm:w-14">
            {artist.profile_image ? (
              <img
                src={artist.profile_image}
                alt={artist.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xl font-bold text-gray-400">
                {artist.name.charAt(0)}
              </span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="truncate text-sm font-bold text-gray-900 sm:text-base">{artist.name}</h3>
              <button
                onClick={handleRemove}
                className="touch-target flex-shrink-0 rounded-full p-1.5 transition-colors hover:bg-gray-100"
                aria-label="Remove from favorites"
              >
                <Heart className="w-4 h-4 fill-red-500 text-red-500" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Link
      href={`/salon/${salonId}`}
      className="block rounded-xl border border-gray-100 bg-white p-3 shadow-sm transition-all duration-200 hover:border-primary-100 hover:shadow-lg sm:p-4"
    >
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200 sm:h-14 sm:w-14">
          {artist.profile_image ? (
            <img
              src={artist.profile_image}
              alt={artist.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-xl font-bold text-gray-400">
              {artist.name.charAt(0)}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <h3 className="font-bold text-gray-900 truncate">{artist.name}</h3>
              {artist.staff_profiles?.specialties && artist.staff_profiles.specialties.length > 0 && (
                <p className="mt-0.5 truncate text-xs text-gray-500 sm:text-sm">
                  {artist.staff_profiles.specialties.slice(0, 2).join(", ")}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={handleRemove}
                className="touch-target rounded-full p-1.5 transition-colors"
                aria-label="Remove from favorites"
              >
                <Heart className="w-4 h-4 fill-red-500 text-red-500" />
              </button>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
});

// Loading Skeleton
function ArtistSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-gray-100 bg-white p-3 sm:p-4">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-full bg-gray-200 sm:h-14 sm:w-14" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="h-3 bg-gray-200 rounded w-1/3" />
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
        <User className="w-8 h-8 text-gray-300" />
      </div>
      <p className="mb-1 text-sm font-medium text-gray-500 sm:text-base">{t("artists.empty")}</p>
      <p className="text-gray-400 text-sm text-center">{t("artists.emptyDescription")}</p>
    </div>
  );
}

export function FavoriteArtistsTab() {
  const tCommon = useTranslations("common");
  const { data: artists, isLoading } = useFavoriteArtists();
  const toggleFavorite = useToggleArtistFavorite();

  const handleRemove = (artistId: string) => {
    // Pass isFavorited: true since we're removing from favorites list
    toggleFavorite.mutate({ artistId, isFavorited: true }, {
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
          <ArtistSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!artists || artists.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-2.5 p-3 sm:space-y-3 sm:p-4">
      {artists.map((artist) => (
        <FavoriteArtistCard
          key={artist.id}
          artist={artist}
          onRemove={handleRemove}
        />
      ))}
    </div>
  );
}
