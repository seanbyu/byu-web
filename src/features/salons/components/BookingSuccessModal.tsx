import { useState, useEffect } from "react";
import { useScrollLock } from "@/hooks/useScrollLock";
import { useTranslations } from "next-intl";
import { Check, X, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { lineQueries } from "@/lib/api/queries";
import { useAuthContext } from "@/features/auth";

type LineChannel = {
  enabled: boolean;
  id: string;
};

type BookingSuccessModalProps = {
  bookingId: string | null;
  salonId: string;
  lineChannel: LineChannel | null;
  onClose: () => void;
};

const LineIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
  </svg>
);

export function BookingSuccessModal({ bookingId, salonId, lineChannel, onClose }: BookingSuccessModalProps) {
  const t = useTranslations("booking");
  const router = useRouter();
  const { isAuthenticated } = useAuthContext();
  const [showLineBanner, setShowLineBanner] = useState(false);
  const [checkingFriend, setCheckingFriend] = useState(false);

  useScrollLock(true);

  const lineUrl = lineChannel?.enabled && lineChannel.id
    ? lineChannel.id.startsWith("http")
      ? lineChannel.id
      : `https://line.me/R/ti/p/${lineChannel.id}`
    : null;

  // LINE 친구 상태 확인
  useEffect(() => {
    if (!lineUrl || !isAuthenticated || !salonId) return;

    let cancelled = false;
    setCheckingFriend(true);

    lineQueries.getFriendStatus(salonId)
      .then((status) => {
        if (cancelled) return;
        // 살롱이 LINE 설정이 있고, 유저가 아직 친구가 아닌 경우에만 배너 표시
        if (status.salonHasLine && !status.isFriend) {
          setShowLineBanner(true);
        }
      })
      .catch(() => {
        // 확인 실패 시 기존 동작 유지 (배너 표시)
        if (!cancelled) setShowLineBanner(true);
      })
      .finally(() => {
        if (!cancelled) setCheckingFriend(false);
      });

    return () => { cancelled = true; };
  }, [lineUrl, isAuthenticated, salonId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50 animate-backdrop" onClick={onClose} />

      <div className="relative w-full max-w-[360px] rounded-2xl bg-white p-6 shadow-xl animate-slide-up">
        <button
          onClick={onClose}
          className="touch-target absolute right-3 top-3 rounded-full p-1.5 hover:bg-gray-100"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>

        {/* Success Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
            <Check className="w-7 h-7 text-green-600" />
          </div>
        </div>

        {/* Title & Message */}
        <h3 className="text-center text-lg font-bold text-gray-900 mb-1">
          {t("bookingPendingTitle")}
        </h3>
        <p className="text-center text-sm text-gray-500 mb-5">
          {t("bookingPendingMessage")}
        </p>

        {/* LINE 확인 중 로딩 */}
        {lineUrl && checkingFriend && (
          <div className="mb-5 flex justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          </div>
        )}

        {/* LINE Friend Add Section - 친구가 아닌 경우에만 표시 */}
        {lineUrl && !checkingFriend && showLineBanner && (
          <div className="mb-5 rounded-xl border border-[#06C755]/30 bg-[#06C755]/5 p-4">
            <p className="text-sm font-semibold text-gray-900 mb-1">
              {t("lineNotFriendTitle")}
            </p>
            <p className="text-xs text-gray-600 mb-3">
              {t("lineNotFriendMessage")}
            </p>
            <a
              href={lineUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#06C755] px-4 py-2.5 text-white transition-opacity hover:opacity-90"
            >
              <LineIcon className="h-4 w-4" />
              <span className="text-sm font-semibold">{t("lineAddFriendAction")}</span>
            </a>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          {bookingId && (
            <button
              onClick={() => {
                onClose();
                router.push(`/bookings/${bookingId}`);
              }}
              className="ds-btn-primary"
            >
              {t("viewBooking")}
            </button>
          )}
          <button
            onClick={onClose}
            className="w-full min-h-[44px] rounded-xl text-sm font-medium text-gray-500 transition-colors hover:bg-gray-50"
          >
            {t("close")}
          </button>
        </div>
      </div>
    </div>
  );
}
