import { useTranslations } from "next-intl";
import { MapPin, Phone, ExternalLink } from "lucide-react";
import type { SalonContactInfoProps } from "../types";

export function SalonContactInfo({ salon }: SalonContactInfoProps) {
  const t = useTranslations("salon");

  const hasCoords = salon.latitude != null && salon.longitude != null;
  const addressText = [salon.address, salon.city].filter(Boolean).join(", ");
  const embedUrl = hasCoords
    ? `https://maps.google.com/maps?q=${salon.latitude},${salon.longitude}&output=embed&hl=ko`
    : null;
  const mapsUrl =
    salon.google_maps_url ||
    (hasCoords
      ? `https://www.google.com/maps/search/?api=1&query=${salon.latitude},${salon.longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressText)}`);

  return (
    <div className="p-3 sm:p-4">
      <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-gray-900 sm:mb-4 sm:text-lg">
        <MapPin className="h-4 w-4 text-primary-500 sm:h-5 sm:w-5" />
        {t("info")}
      </h2>
      <div className="space-y-3">
        {salon.phone && (
          <a href={`tel:${salon.phone}`} className="touch-target flex items-center gap-2.5 text-gray-700 hover:text-primary-600 sm:gap-3">
            <Phone className="h-4 w-4 text-gray-500 sm:h-5 sm:w-5" />
            <span className="text-xs sm:text-sm">{salon.phone}</span>
          </a>
        )}
        {salon.address && (
          <div className="flex items-start gap-2.5 text-gray-700 sm:gap-3">
            <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-500 sm:h-5 sm:w-5" />
            <span className="text-xs sm:text-sm">{addressText}</span>
          </div>
        )}
        {(salon.address || hasCoords || salon.google_maps_url) && (
          <div className="mt-3 overflow-hidden rounded-xl border border-gray-200">
            {embedUrl && (
              <iframe
                src={embedUrl}
                width="100%"
                height="200"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="salon location map"
              />
            )}
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-primary-600 hover:bg-gray-50"
              style={embedUrl ? { borderTop: "1px solid #f3f4f6" } : undefined}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              {t("viewOnMap")}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
