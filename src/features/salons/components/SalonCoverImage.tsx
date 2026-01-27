import { useTranslations } from "next-intl";
import { MapPin } from "lucide-react";
import type { Salon } from "@/lib/supabase/types";

type Props = {
  salon: Salon;
  isOpen: boolean;
};

export function SalonCoverImage({ salon, isOpen }: Props) {
  const t = useTranslations("salon");

  return (
    <>
      {/* Cover Image */}
      <div className="relative h-48 bg-gradient-to-br from-purple-100 to-pink-100">
        {salon.cover_image_url ? (
          <img
            src={salon.cover_image_url}
            alt={salon.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-6xl font-bold text-purple-200">
              {salon.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div
          className={`absolute bottom-4 left-4 px-3 py-1.5 rounded-full text-sm font-medium shadow-lg ${
            isOpen ? "bg-green-500 text-white" : "bg-gray-800 text-white"
          }`}
        >
          {isOpen ? t("open") : t("closed")}
        </div>
      </div>

      {/* Salon Info */}
      <div className="p-4">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm">
            {salon.logo_url ? (
              <img src={salon.logo_url} alt={salon.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl font-bold text-gray-400">{salon.name.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-gray-900">{salon.name}</h1>
            {salon.address && (
              <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {salon.address}
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
