"use client";

import { memo, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Star, Instagram, Youtube, Facebook, Heart } from "lucide-react";
import { toast } from "sonner";
import { useFavorites } from "@/features/favorites";
import { useAuthContext } from "@/features/auth";
import { LoginModal } from "@/features/auth/components/LoginModal";
import type { ArtistTimeSlotsProps, ArtistSlotProps } from "../types";

// TikTok 아이콘 (lucide-react에 없어서 커스텀)
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
  </svg>
);

const ArtistSlots = memo(function ArtistSlots({
  artist,
  selectedDate,
  isSalonHoliday,
  isDateEnabled,
  isArtistHoliday,
  getArtistTimeSlots,
  isSlotAvailable,
  onTimeSlotClick,
}: ArtistSlotProps) {
  const tCommon = useTranslations("common");

  const salonClosed = isSalonHoliday(selectedDate) || !isDateEnabled(selectedDate);

  if (salonClosed) {
    return (
      <div className="flex flex-wrap gap-2">
        <p className="text-sm text-gray-400">{tCommon("closed")}</p>
      </div>
    );
  }

  if (isArtistHoliday(artist, selectedDate)) {
    return (
      <div className="flex flex-wrap gap-2">
        <p className="text-sm text-gray-400">{tCommon("closedToday")}</p>
      </div>
    );
  }

  const artistTimeSlots = getArtistTimeSlots(artist);

  return (
    <div className="flex flex-wrap gap-2">
      {artistTimeSlots.length > 0 ? (
        artistTimeSlots.map((time) => {
          const available = isSlotAvailable(artist.id, time);
          return (
            <button
              key={time}
              onClick={() => available && onTimeSlotClick(artist, time)}
              disabled={!available}
              className={`touch-target rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                available
                  ? "bg-white border border-primary-200 text-primary-600 hover:bg-primary-50 hover:border-primary-400"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed line-through"
              }`}
            >
              {time}
            </button>
          );
        })
      ) : (
        <p className="text-sm text-gray-400">{tCommon("closedToday")}</p>
      )}
    </div>
  );
});

export const ArtistTimeSlots = memo(function ArtistTimeSlots({
  staff,
  selectedDate,
  isSalonHoliday,
  isDateEnabled,
  isArtistHoliday,
  getArtistTimeSlots,
  isSlotAvailable,
  onTimeSlotClick,
}: ArtistTimeSlotsProps) {
  const tBooking = useTranslations("booking");
  const tCommon = useTranslations("common");
  const { isAuthenticated } = useAuthContext();
  const { isArtistFavorited, toggleArtistFavorite } = useFavorites();
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleToggleFavorite = useCallback(async (artistId: string) => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    const result = await toggleArtistFavorite(artistId);
    if (result.success) {
      if (result.isFavorited) {
        toast.success(tCommon("favorite.added"));
      } else {
        toast.success(tCommon("favorite.removed"));
      }
    }
  }, [isAuthenticated, toggleArtistFavorite, tCommon]);

  return (
    <>
      <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-900 sm:text-base">
        <Star className="h-4 w-4 text-primary-500" />
        {tBooking("selectArtist")}
      </h3>

      {staff.length > 0 ? (
        <div className="space-y-3 sm:space-y-4">
          {staff.map((artist) => {
            const isFavorited = isArtistFavorited(artist.id);

            return (
              <div key={artist.id} className="rounded-xl bg-gray-50 p-3 sm:p-4">
                {/* Designer Info */}
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200 sm:h-12 sm:w-12">
                    {artist.profile_image ? (
                      <img
                        src={artist.profile_image}
                        alt={artist.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-lg font-bold text-gray-400">
                        {artist.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900 sm:text-base">{artist.name}</p>
                      {/* Favorite Button */}
                      <button
                        onClick={() => handleToggleFavorite(artist.id)}
                        className="touch-target rounded-full p-1 transition-colors hover:bg-gray-200"
                        aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
                      >
                        <Heart
                          className={`w-4 h-4 transition-colors ${
                            isFavorited
                              ? "fill-red-500 text-red-500"
                              : "text-gray-300 hover:text-red-400"
                          }`}
                        />
                      </button>
                    </div>
                    {/* SNS Icons */}
                    {artist.staff_profiles?.social_links && (() => {
                      const socialLinks = artist.staff_profiles.social_links;
                      const icons = [
                        socialLinks.instagram && {
                          key: 'instagram',
                          href: socialLinks.instagram,
                          icon: <Instagram className="h-3.5 w-3.5 sm:h-4 sm:w-4" />,
                          color: 'text-pink-500',
                        },
                        socialLinks.youtube && {
                          key: 'youtube',
                          href: socialLinks.youtube,
                          icon: <Youtube className="h-3.5 w-3.5 sm:h-4 sm:w-4" />,
                          color: 'text-red-500',
                        },
                        socialLinks.tiktok && {
                          key: 'tiktok',
                          href: socialLinks.tiktok,
                          icon: <TikTokIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />,
                          color: 'text-black',
                        },
                        socialLinks.facebook && {
                          key: 'facebook',
                          href: socialLinks.facebook,
                          icon: <Facebook className="h-3.5 w-3.5 sm:h-4 sm:w-4" />,
                          color: 'text-blue-600',
                        },
                      ].filter(Boolean) as { key: string; href: string; icon: React.ReactNode; color: string }[];

                      if (icons.length === 0) return null;

                      return (
                        <div className="flex items-center gap-2">
                          {icons.map((item, index) => (
                            <span key={item.key} className="flex items-center gap-2">
                              <a
                                href={item.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={item.color}
                              >
                                {item.icon}
                              </a>
                              {index < icons.length - 1 && (
                                <span className="text-gray-300">|</span>
                              )}
                            </span>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Time Slots */}
                <ArtistSlots
                  artist={artist}
                  selectedDate={selectedDate}
                  isSalonHoliday={isSalonHoliday}
                  isDateEnabled={isDateEnabled}
                  isArtistHoliday={isArtistHoliday}
                  getArtistTimeSlots={getArtistTimeSlots}
                  isSlotAvailable={isSlotAvailable}
                  onTimeSlotClick={onTimeSlotClick}
                />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400">
          <p>{tBooking("noArtists")}</p>
        </div>
      )}

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
