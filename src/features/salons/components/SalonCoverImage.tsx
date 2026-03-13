import { useTranslations } from "next-intl";
import { Languages } from "lucide-react";
import { getSalonCoverUrls } from "@/lib/supabase/storage";
import { StorageImage } from "@/components/ui/StorageImage";
import type { SalonCoverImageProps } from "../types";

export function SalonCoverImage({ salon, status }: SalonCoverImageProps) {
  const t = useTranslations("salon");
  const tCommon = useTranslations("common");

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

  return (
    <>
      {/* Cover Image */}
      <div className="relative h-44 bg-gradient-to-br from-primary-100 to-secondary-100 sm:h-48">
        <StorageImage
          urls={getSalonCoverUrls(salon.id)}
          alt={salon.name}
          className="object-cover"
          priority
          sizes="100vw"
          fallback={
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-6xl font-bold text-primary-200">
                {salon.name.charAt(0).toUpperCase()}
              </span>
            </div>
          }
        />
        <div className={`absolute bottom-3 left-3 rounded-full px-2.5 py-1 text-xs font-medium shadow-lg sm:bottom-4 sm:left-4 sm:px-3 sm:py-1.5 sm:text-sm ${badge.className}`}>
          {badge.label}
        </div>
      </div>

      {/* Salon Info */}
      <div className="p-3 sm:p-4">
        <h1 className="text-base font-bold text-gray-900 sm:text-lg">{salon.name}</h1>
        <div className="mt-1 flex items-center gap-1.5 text-xs text-primary-600">
          <Languages className="h-3.5 w-3.5 flex-shrink-0" />
          <span>{t("interpreterDesc")}</span>
        </div>
      </div>
    </>
  );
}
