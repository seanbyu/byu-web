import { memo } from "react";
import { Check, User } from "lucide-react";
import { useTranslations } from "next-intl";
import type { StaffWithProfile } from "@/lib/supabase/types";

export const DesignerStep = memo(function DesignerStep({
  staff,
  selectedDesigner,
  onSelect,
  t,
}: {
  staff: StaffWithProfile[];
  selectedDesigner: StaffWithProfile | null;
  onSelect: (designer: StaffWithProfile) => void;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <div>
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <User className="w-5 h-5 text-primary-500" />
        {t("selectDesigner")}
      </h2>

      <div className="grid grid-cols-2 gap-3">
        {staff.map((designer) => (
          <button
            key={designer.id}
            onClick={() => onSelect(designer)}
            className={`p-4 rounded-xl border-2 text-center transition-all ${
              selectedDesigner?.id === designer.id
                ? "border-primary-500 bg-primary-50"
                : "border-gray-100 hover:border-gray-200"
            }`}
          >
            <div className="w-16 h-16 mx-auto rounded-full bg-gray-100 flex items-center justify-center overflow-hidden mb-3">
              {designer.profile_image ? (
                <img
                  src={designer.profile_image}
                  alt={designer.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xl font-bold text-gray-400">
                  {designer.name.charAt(0)}
                </span>
              )}
            </div>
            <p className="font-medium text-gray-900">{designer.name}</p>
            {designer.staff_profiles?.years_of_experience && (
              <p className="text-xs text-gray-500 mt-1">
                경력 {designer.staff_profiles.years_of_experience}년
              </p>
            )}
            {designer.staff_profiles?.specialties?.[0] && (
              <p className="text-xs text-primary-500 mt-1 truncate">
                {designer.staff_profiles.specialties[0]}
              </p>
            )}
            {selectedDesigner?.id === designer.id && (
              <Check className="w-5 h-5 text-primary-500 mx-auto mt-2" />
            )}
          </button>
        ))}
      </div>

      {staff.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          {t("noDesigners")}
        </div>
      )}
    </div>
  );
});
