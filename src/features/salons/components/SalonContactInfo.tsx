import { useTranslations } from "next-intl";
import { MapPin, Phone } from "lucide-react";
import type { Salon } from "@/lib/supabase/types";

type Props = {
  salon: Salon;
};

export function SalonContactInfo({ salon }: Props) {
  const t = useTranslations("salon");

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
        <MapPin className="w-5 h-5 text-purple-500" />
        {t("info")}
      </h2>
      <div className="space-y-3">
        {salon.phone && (
          <a href={`tel:${salon.phone}`} className="flex items-center gap-3 text-gray-700 hover:text-purple-600">
            <Phone className="w-5 h-5 text-gray-400" />
            <span className="text-sm">{salon.phone}</span>
          </a>
        )}
        {salon.address && (
          <div className="flex items-start gap-3 text-gray-700">
            <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
            <span className="text-sm">
              {salon.address}
              {salon.city && `, ${salon.city}`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
