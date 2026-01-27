import { useTranslations } from "next-intl";
import { Clock, X, ChevronDown, Tag } from "lucide-react";
import type { StaffWithProfile, ServiceCategory } from "@/lib/supabase/types";
import { getLocaleCode } from "../utils";

type Props = {
  designer: StaffWithProfile;
  time: string;
  selectedDate: Date;
  locale: string;
  categories: ServiceCategory[];
  selectedCategory: string;
  setSelectedCategory: (id: string) => void;
  getCategoryName: (category: ServiceCategory) => string;
  customerNotes: string;
  setCustomerNotes: (notes: string) => void;
  isSubmitting: boolean;
  onSubmit: () => void;
  onClose: () => void;
};

export function BookingConfirmModal({
  designer,
  time,
  selectedDate,
  locale,
  categories,
  selectedCategory,
  setSelectedCategory,
  getCategoryName,
  customerNotes,
  setCustomerNotes,
  isSubmitting,
  onSubmit,
  onClose,
}: Props) {
  const tBooking = useTranslations("booking");
  const localeCode = getLocaleCode(locale);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative w-full max-w-[448px] bg-white rounded-t-2xl shadow-xl animate-slide-up">
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        <div className="px-6 pb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            {tBooking("confirmBooking")}
          </h3>

          {/* Designer Info */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl mb-4">
            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
              {designer.profile_image ? (
                <img
                  src={designer.profile_image}
                  alt={designer.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-lg font-bold text-gray-400">
                  {designer.name.charAt(0)}
                </span>
              )}
            </div>
            <div>
              <p className="font-medium text-gray-900">{designer.name}</p>
              <p className="text-sm text-gray-500">{tBooking("designer")}</p>
            </div>
          </div>

          {/* Time Info */}
          <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl mb-4">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="font-bold text-purple-600 text-lg">{time}</p>
              <p className="text-sm text-gray-500">
                {selectedDate.toLocaleDateString(localeCode, { month: "long", day: "numeric", weekday: "long" })}
              </p>
            </div>
          </div>

          {/* Category Select */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Tag className="w-4 h-4 inline-block mr-1" />
              {tBooking("selectCategory")}
            </label>
            {categories.length > 0 ? (
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none appearance-none bg-white text-sm pr-10"
                >
                  <option value="" disabled>
                    {tBooking("selectCategoryPlaceholder")}
                  </option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {getCategoryName(category)}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            ) : (
              <p className="text-sm text-gray-400 px-4 py-3 bg-gray-50 rounded-xl">
                {tBooking("noCategories")}
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {tBooking("customerNotes")}
            </label>
            <textarea
              value={customerNotes}
              onChange={(e) => setCustomerNotes(e.target.value)}
              placeholder={tBooking("customerNotesPlaceholder")}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none resize-none text-sm"
              rows={3}
            />
          </div>

          {/* Submit Button */}
          <button
            onClick={onSubmit}
            disabled={isSubmitting}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white font-semibold py-4 rounded-xl transition-colors"
          >
            {isSubmitting ? tBooking("processing") : tBooking("confirmBooking")}
          </button>
        </div>
      </div>
    </div>
  );
}
