import { useTranslations } from "next-intl";
import { Star } from "lucide-react";
import type { StaffWithProfile } from "@/lib/supabase/types";

type Props = {
  staff: StaffWithProfile[];
  selectedDate: Date;
  isSalonHoliday: (date: Date) => boolean;
  isDateEnabled: (date: Date) => boolean;
  isDesignerHoliday: (designer: StaffWithProfile, date: Date) => boolean;
  getDesignerTimeSlots: (designer: StaffWithProfile) => string[];
  isSlotAvailable: (designerId: string, time: string) => boolean;
  onTimeSlotClick: (designer: StaffWithProfile, time: string) => void;
};

export function DesignerTimeSlots({
  staff,
  selectedDate,
  isSalonHoliday,
  isDateEnabled,
  isDesignerHoliday,
  getDesignerTimeSlots,
  isSlotAvailable,
  onTimeSlotClick,
}: Props) {
  const tBooking = useTranslations("booking");
  const tCommon = useTranslations("common");

  return (
    <>
      <h3 className="text-base font-bold flex items-center gap-2 mb-3">
        <Star className="w-4 h-4 text-purple-500" />
        {tBooking("selectDesigner")}
      </h3>

      {staff.length > 0 ? (
        <div className="space-y-4">
          {staff.map((designer) => (
            <div key={designer.id} className="bg-gray-50 rounded-xl p-4">
              {/* Designer Info */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
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
                  {designer.staff_profiles?.specialties?.[0] && (
                    <p className="text-xs text-purple-600">
                      {designer.staff_profiles.specialties[0]}
                    </p>
                  )}
                </div>
              </div>

              {/* Time Slots */}
              <DesignerSlots
                designer={designer}
                selectedDate={selectedDate}
                isSalonHoliday={isSalonHoliday}
                isDateEnabled={isDateEnabled}
                isDesignerHoliday={isDesignerHoliday}
                getDesignerTimeSlots={getDesignerTimeSlots}
                isSlotAvailable={isSlotAvailable}
                onTimeSlotClick={onTimeSlotClick}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400">
          <p>{tBooking("noDesigners")}</p>
        </div>
      )}
    </>
  );
}

function DesignerSlots({
  designer,
  selectedDate,
  isSalonHoliday,
  isDateEnabled,
  isDesignerHoliday,
  getDesignerTimeSlots,
  isSlotAvailable,
  onTimeSlotClick,
}: {
  designer: StaffWithProfile;
  selectedDate: Date;
  isSalonHoliday: (date: Date) => boolean;
  isDateEnabled: (date: Date) => boolean;
  isDesignerHoliday: (designer: StaffWithProfile, date: Date) => boolean;
  getDesignerTimeSlots: (designer: StaffWithProfile) => string[];
  isSlotAvailable: (designerId: string, time: string) => boolean;
  onTimeSlotClick: (designer: StaffWithProfile, time: string) => void;
}) {
  const tCommon = useTranslations("common");

  const salonClosed = isSalonHoliday(selectedDate) || !isDateEnabled(selectedDate);

  if (salonClosed) {
    return (
      <div className="flex flex-wrap gap-2">
        <p className="text-sm text-gray-400">{tCommon("closed")}</p>
      </div>
    );
  }

  if (isDesignerHoliday(designer, selectedDate)) {
    return (
      <div className="flex flex-wrap gap-2">
        <p className="text-sm text-gray-400">{tCommon("closedToday")}</p>
      </div>
    );
  }

  const designerTimeSlots = getDesignerTimeSlots(designer);

  return (
    <div className="flex flex-wrap gap-2">
      {designerTimeSlots.length > 0 ? (
        designerTimeSlots.map((time) => {
          const available = isSlotAvailable(designer.id, time);
          return (
            <button
              key={time}
              onClick={() => available && onTimeSlotClick(designer, time)}
              disabled={!available}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                available
                  ? "bg-white border border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-400"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed line-through"
              }`}
            >
              {time}
            </button>
          );
        })
      ) : (
        <p className="text-sm text-gray-400">{tCommon("closedToday")}</p>
      )}
    </div>
  );
}
