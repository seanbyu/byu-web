import { useTranslations } from "next-intl";
import { MapPin, Phone } from "lucide-react";
import type { SalonContactInfoProps } from "../types";

export function SalonContactInfo({ salon }: SalonContactInfoProps) {
  const t = useTranslations("salon");

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
            <span className="text-xs sm:text-sm">
              {salon.address}
              {salon.city && `, ${salon.city}`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
