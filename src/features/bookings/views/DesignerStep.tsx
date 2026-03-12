import { memo } from "react";
import { Check, User, Instagram, Youtube, Facebook } from "lucide-react";
import type { ArtistStepProps } from "../types";

// TikTok 아이콘 (lucide-react에 없어서 커스텀)
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
  </svg>
);

export const DesignerStep = memo(function DesignerStep({
  staff,
  selectedArtist,
  onSelect,
  t,
}: ArtistStepProps) {
  return (
    <div>
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <User className="w-5 h-5 text-primary-500" />
        {t("selectArtist")}
      </h2>

      <div className="grid grid-cols-2 gap-3">
        {staff.map((designer) => (
          <button
            key={designer.id}
            onClick={() => onSelect(designer)}
            className={`p-4 rounded-xl border-2 text-center transition-all ${
              selectedArtist?.id === designer.id
                ? "border-primary-500 bg-primary-50"
                : "border-gray-100 hover:border-gray-200"
            }`}
          >
            <div className="w-16 h-16 mx-auto rounded-full bg-gray-100 flex items-center justify-center overflow-hidden mb-3">
              {designer.profile_image ? (
                <img
                  src={designer.profile_image}
                  alt={designer.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xl font-bold text-gray-400">
                  {designer.name.charAt(0)}
                </span>
              )}
            </div>
            <p className="font-medium text-gray-900">{designer.name}</p>
            {/* SNS Icons */}
            {designer.staff_profiles?.social_links && (() => {
              const socialLinks = designer.staff_profiles.social_links;
              const icons = [
                socialLinks.instagram && {
                  key: 'instagram',
                  href: socialLinks.instagram,
                  icon: <Instagram className="w-3.5 h-3.5" />,
                  color: 'text-pink-500',
                },
                socialLinks.youtube && {
                  key: 'youtube',
                  href: socialLinks.youtube,
                  icon: <Youtube className="w-3.5 h-3.5" />,
                  color: 'text-red-500',
                },
                socialLinks.tiktok && {
                  key: 'tiktok',
                  href: socialLinks.tiktok,
                  icon: <TikTokIcon className="w-3.5 h-3.5" />,
                  color: 'text-black',
                },
                socialLinks.facebook && {
                  key: 'facebook',
                  href: socialLinks.facebook,
                  icon: <Facebook className="w-3.5 h-3.5" />,
                  color: 'text-blue-600',
                },
              ].filter(Boolean) as { key: string; href: string; icon: React.ReactNode; color: string }[];

              if (icons.length === 0) return null;

              return (
                <div className="flex items-center justify-center gap-1.5 mt-2 pt-2 border-t border-gray-100">
                  {icons.map((item, index) => (
                    <span key={item.key} className="flex items-center gap-1.5">
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className={item.color}
                      >
                        {item.icon}
                      </a>
                      {index < icons.length - 1 && (
                        <span className="text-gray-200">|</span>
                      )}
                    </span>
                  ))}
                </div>
              );
            })()}
            {selectedArtist?.id === designer.id && (
              <Check className="w-5 h-5 text-primary-500 mx-auto mt-2" />
            )}
          </button>
        ))}
      </div>

      {staff.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          {t("noArtists")}
        </div>
      )}
    </div>
  );
});

export const ArtistStep = DesignerStep;
