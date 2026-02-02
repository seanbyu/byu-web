import { useTranslations } from "next-intl";
import { MapPin } from "lucide-react";
import { getSalonCoverUrls } from "@/lib/supabase/storage";
import { StorageImage } from "@/components/ui/StorageImage";
import type { SalonCoverImageProps } from "../types";

export function SalonCoverImage({ salon, isOpen }: SalonCoverImageProps) {
  const t = useTranslations("salon");

  return (
    <>
      {/* Cover Image */}
      <div className="relative h-48 bg-gradient-to-br from-primary-100 to-secondary-100">
        <StorageImage
          urls={getSalonCoverUrls(salon.id)}
          alt={salon.name}
          className="w-full h-full object-cover"
          fallback={
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-6xl font-bold text-primary-200">
                {salon.name.charAt(0).toUpperCase()}
              </span>
            </div>
          }
        />
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
        <h1 className="text-lg font-bold text-gray-900">{salon.name}</h1>
        {salon.address && (
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(salon.address)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gray-500 mt-1 flex items-center gap-1 hover:text-primary-600 transition-colors"
          >
            <MapPin className="w-3 h-3" />
            <span className="underline underline-offset-2">{salon.address}</span>
          </a>
        )}
      </div>
    </>
  );
}
