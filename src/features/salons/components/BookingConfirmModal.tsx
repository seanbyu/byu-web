import { useEffect, useState } from "react";
import { useScrollLock } from "@/hooks/useScrollLock";
import { useTranslations } from "next-intl";
import { Clock, X, ChevronDown, Tag } from "lucide-react";
import { getLocaleCode } from "../utils";
import type { BookingConfirmModalProps } from "../types";

export function BookingConfirmModal({
  artist,
  time,
  selectedDate,
  locale,
  categories,
  categoryLastBookingTimes,
  selectedCategory,
  setSelectedCategory,
  getCategoryName,
  customerNotes,
  setCustomerNotes,
  isSubmitting,
  onSubmit,
  showPhoneConfirmModal,
  phoneInput,
  setPhoneInput,
  phoneValidationError,
  onConfirmPhoneSubmit,
  onCancelPhoneConfirm,
  onClose,
}: BookingConfirmModalProps) {
  const tBooking = useTranslations("booking");
  const localeCode = getLocaleCode(locale);

  // 선택한 시간 기준으로 cutoff가 지난 카테고리 판별
  const [slotH, slotM] = time.split(":").map(Number);
  const slotMins = slotH * 60 + slotM;
  const isCategoryDisabled = (categoryId: string): boolean => {
    const cutoff = categoryLastBookingTimes?.[categoryId];
    if (!cutoff) return false;
    const [ch, cm] = cutoff.split(":").map(Number);
    return slotMins > ch * 60 + cm;
  };

  const isCategorySelected = Boolean(selectedCategory) && !isCategoryDisabled(selectedCategory);
  const [visible, setVisible] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  useScrollLock(true);

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const artistPosition =
    localeCode.startsWith("th")
      ? artist.staff_profiles?.position_name_th
      : localeCode.startsWith("en")
        ? artist.staff_profiles?.position_name_en
        : artist.staff_profiles?.position_name;

  return (
    <div className="fixed inset-0 z-[200] flex justify-center">
      <div className="relative flex h-full w-full max-w-[var(--app-max-width)] items-end">
        <div
          className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`}
          onClick={onClose}
        />

        <div className={`relative w-full max-h-[85dvh] overflow-y-auto rounded-t-2xl bg-white shadow-xl pb-safe ${visible ? "animate-slide-up" : "translate-y-full"}`}>
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 bg-gray-300 rounded-full" />
          </div>

          <button
            onClick={onClose}
            className="touch-target absolute right-4 top-4 rounded-full p-2 hover:bg-gray-100"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>

          <div className="px-5 pb-5">
          <h3 className="mb-3 text-base font-bold text-gray-900">
            {tBooking("confirmBooking")}
          </h3>

          {/* Designer Info */}
          <div className="mb-3 flex items-center gap-2.5 rounded-xl bg-gray-50 p-2.5">
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gray-200">
              {artist.profile_image ? (
                <img
                  src={artist.profile_image}
                  alt={artist.name}
                  onLoad={() => setImgLoaded(true)}
                  className={`w-full h-full object-cover transition-opacity duration-200 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
                />
              ) : (
                <span className="text-base font-bold text-gray-400">
                  {artist.name.charAt(0)}
                </span>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{artist.name}</p>
              <p className="text-xs text-gray-700">{artistPosition || tBooking("artist")}</p>
            </div>
          </div>

          {/* Time Info */}
          <div className="mb-3 flex items-center gap-2.5 rounded-xl bg-primary-50 p-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100">
              <Clock className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <p className="text-base font-bold text-primary-600">{time}</p>
              <p className="text-xs font-medium text-gray-700">
                {selectedDate.toLocaleDateString(localeCode, { month: "long", day: "numeric", weekday: "long" })}
              </p>
            </div>
          </div>

          {/* Category Select */}
          <div className="mb-4">
            <label className="ds-label">
              <Tag className="w-4 h-4 inline-block mr-1" />
              {tBooking("selectCategory")}
            </label>
            {categories.length > 0 ? (
              <div className="relative">
                <select
                  value={isCategoryDisabled(selectedCategory) ? "" : selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="ds-select text-gray-900"
                >
                  {isCategoryDisabled(selectedCategory) && (
                    <option value="" disabled>
                      {tBooking("selectCategoryRequired")}
                    </option>
                  )}
                  {categories.map((category) => {
                    const disabled = isCategoryDisabled(category.id);
                    const cutoff = categoryLastBookingTimes?.[category.id];
                    return (
                      <option key={category.id} value={category.id} disabled={disabled}>
                        {disabled && cutoff
                          ? `${getCategoryName(category)} (${tBooking("categoryPastCutoff", { time: cutoff })})`
                          : getCategoryName(category)}
                      </option>
                    );
                  })}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
              </div>
            ) : (
              <p className="rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-600">
                {tBooking("noCategories")}
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="mb-5">
            <label className="ds-label">
              {tBooking("customerNotes")}
            </label>
            <textarea
              value={customerNotes}
              onChange={(e) => setCustomerNotes(e.target.value)}
              placeholder={tBooking("customerNotesPlaceholder")}
              className="ds-textarea"
              rows={3}
            />
          </div>

          {/* Submit Button */}
          <button
            onClick={onSubmit}
            disabled={isSubmitting || !isCategorySelected}
            className="ds-btn-primary"
          >
            {isSubmitting ? tBooking("processing") : tBooking("confirmBooking")}
          </button>
        </div>

        {showPhoneConfirmModal && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/45 px-4">
            <div className="w-full max-w-[320px] rounded-2xl bg-white p-4 shadow-xl">
              <h4 className="text-sm font-semibold text-gray-900">
                {tBooking("phoneConfirmTitle")}
              </h4>
              <p className="mt-1.5 text-xs text-gray-600">
                {tBooking("phoneConfirmMessage")}
              </p>

              <label className="ds-label mt-4">{tBooking("customerPhone")}</label>
              <input
                type="tel"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder={tBooking("phoneConfirmPlaceholder")}
                className="ds-input"
              />

              {phoneValidationError && (
                <p className="mt-2 text-xs text-red-600">{phoneValidationError}</p>
              )}

              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  onClick={onCancelPhoneConfirm}
                  className="min-h-[42px] rounded-xl border border-gray-300 bg-white px-3 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  {tBooking("cancel")}
                </button>
                <button
                  onClick={onConfirmPhoneSubmit}
                  disabled={isSubmitting}
                  className="min-h-[42px] rounded-xl bg-primary-600 px-3 text-xs font-semibold text-white transition-colors hover:bg-primary-700 disabled:bg-gray-300"
                >
                  {isSubmitting ? tBooking("processing") : tBooking("confirmBooking")}
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
