import { memo } from "react";
import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Salon, StaffWithProfile, Service } from "@/lib/supabase/types";

export const ConfirmStep = memo(function ConfirmStep({
  salon,
  service,
  designer,
  date,
  time,
  notes,
  onNotesChange,
  t,
}: {
  salon: Salon;
  service: Service;
  designer: StaffWithProfile;
  date: Date;
  time: string;
  notes: string;
  onNotesChange: (notes: string) => void;
  t: ReturnType<typeof useTranslations>;
}) {
  const formatDate = (date: Date) => {
    const days = ["일", "월", "화", "수", "목", "금", "토"];
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 (${days[date.getDay()]})`;
  };

  return (
    <div>
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Check className="w-5 h-5 text-primary-500" />
        {t("confirmBooking")}
      </h2>

      {/* Booking Summary */}
      <div className="bg-gray-50 rounded-xl p-4 space-y-4">
        {/* Salon */}
        <div>
          <p className="text-xs text-gray-500">{t("salon")}</p>
          <p className="font-medium">{salon.name}</p>
        </div>

        {/* Service */}
        <div>
          <p className="text-xs text-gray-500">{t("service")}</p>
          <p className="font-medium">{service.name}</p>
          <p className="text-sm text-gray-500">{service.duration_minutes}분</p>
        </div>

        {/* Designer */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
            {designer.profile_image ? (
              <img
                src={designer.profile_image}
                alt={designer.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-sm font-bold text-gray-400">
                {designer.name.charAt(0)}
              </span>
            )}
          </div>
          <div>
            <p className="text-xs text-gray-500">{t("designer")}</p>
            <p className="font-medium">{designer.name}</p>
          </div>
        </div>

        {/* Date & Time */}
        <div>
          <p className="text-xs text-gray-500">{t("dateTime")}</p>
          <p className="font-medium">{formatDate(date)}</p>
          <p className="text-sm text-gray-600">{time}</p>
        </div>

        {/* Price */}
        <div className="pt-3 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">{t("totalPrice")}</span>
            <span className="text-xl font-bold text-primary-600">
              ฿{(service.base_price || 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="mt-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t("customerNotes")}
        </label>
        <textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder={t("customerNotesPlaceholder")}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none resize-none"
          rows={3}
        />
      </div>
    </div>
  );
});
