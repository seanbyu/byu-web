import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Clock, X, ChevronDown, Tag } from "lucide-react";
import { getLocaleCode } from "../utils";
import type { BookingConfirmModalProps } from "../types";

export function BookingConfirmModal({
  designer,
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

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />

      <div className={`relative w-full max-w-[448px] bg-white rounded-t-2xl shadow-xl ${visible ? "animate-slide-up" : "translate-y-full"}`}>
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        <button
          onClick={onClose}
          className="touch-target absolute right-4 top-4 rounded-full p-2 hover:bg-gray-100"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>

        <div className="px-6 pb-24">
          <h3 className="mb-4 text-lg font-bold text-gray-900">
            {tBooking("confirmBooking")}
          </h3>

          {/* Designer Info */}
          <div className="mb-4 flex items-center gap-3 rounded-xl bg-gray-50 p-3">
            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
              {designer.profile_image ? (
                <img
                  src={designer.profile_image}
                  alt={designer.name}
                  onLoad={() => setImgLoaded(true)}
                  className={`w-full h-full object-cover transition-opacity duration-200 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
                />
              ) : (
                <span className="text-lg font-bold text-gray-400">
                  {designer.name.charAt(0)}
                </span>
              )}
            </div>
            <div>
              <p className="font-medium text-gray-900">{designer.name}</p>
              <p className="text-sm text-gray-700">{tBooking("designer")}</p>
            </div>
          </div>

          {/* Time Info */}
          <div className="mb-4 flex items-center gap-3 rounded-xl bg-primary-50 p-3">
            <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
              <Clock className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <p className="font-bold text-primary-600 text-lg">{time}</p>
              <p className="text-sm font-medium text-gray-700">
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
          <div className="mb-6">
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
            <div className="w-full rounded-2xl bg-white p-5 shadow-xl">
              <h4 className="text-base font-semibold text-gray-900">
                {tBooking("phoneConfirmTitle")}
              </h4>
              <p className="mt-2 text-sm text-gray-600">
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
                <p className="mt-2 text-sm text-red-600">{phoneValidationError}</p>
              )}

              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  onClick={onCancelPhoneConfirm}
                  className="min-h-[44px] rounded-xl border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  {tBooking("cancel")}
                </button>
                <button
                  onClick={onConfirmPhoneSubmit}
                  disabled={isSubmitting}
                  className="min-h-[44px] rounded-xl bg-primary-600 px-3 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:bg-gray-300"
                >
                  {isSubmitting ? tBooking("processing") : tBooking("confirmBooking")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
