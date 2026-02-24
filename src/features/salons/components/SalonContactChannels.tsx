"use client";

import { useTranslations } from "next-intl";
import { MessageCircle, Instagram } from "lucide-react";
import type { Salon } from "@/lib/supabase/types";

// LINE 아이콘 (lucide-react에 없어서 커스텀)
const LineIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
  </svg>
);

type SalonContactChannelsProps = {
  salon: Salon;
};

export function SalonContactChannels({ salon }: SalonContactChannelsProps) {
  const t = useTranslations("salon");

  const contactChannels = (salon.settings as Record<string, unknown> | null)?.contact_channels as {
    instagram?: { enabled: boolean; id: string };
    line?: { enabled: boolean; id: string };
  } | undefined;

  // 활성화된 채널이 없으면 렌더링하지 않음
  const hasEnabledChannels =
    (contactChannels?.instagram?.enabled && contactChannels.instagram.id) ||
    (contactChannels?.line?.enabled && contactChannels.line.id);

  if (!hasEnabledChannels) {
    return null;
  }

  return (
    <div className="p-3 sm:p-4">
      <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-gray-900 sm:mb-4 sm:text-lg">
        <MessageCircle className="h-4 w-4 text-primary-500 sm:h-5 sm:w-5" />
        {t("contact")}
      </h2>
      <div className="flex flex-wrap gap-2.5 sm:gap-3">
        {/* Instagram DM */}
        {contactChannels?.instagram?.enabled && contactChannels.instagram.id && (
          <a
            href={contactChannels.instagram.id}
            target="_blank"
            rel="noopener noreferrer"
            className="touch-target flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 px-3 py-2 text-white transition-opacity hover:opacity-90 sm:gap-2 sm:px-4 sm:py-2.5"
          >
            <Instagram className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="text-xs font-medium sm:text-sm">Instagram</span>
          </a>
        )}

        {/* LINE */}
        {contactChannels?.line?.enabled && contactChannels.line.id && (
          <a
            href={contactChannels.line.id.startsWith("http")
              ? contactChannels.line.id
              : `https://line.me/R/ti/p/${contactChannels.line.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="touch-target flex items-center gap-1.5 rounded-xl bg-line-500 px-3 py-2 text-white transition-colors hover:bg-line-600 sm:gap-2 sm:px-4 sm:py-2.5"
          >
            <LineIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="text-xs font-medium sm:text-sm">LINE</span>
          </a>
        )}
      </div>
    </div>
  );
}
