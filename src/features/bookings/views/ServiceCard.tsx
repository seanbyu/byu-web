import { Check, Clock } from "lucide-react";
import type { Service } from "@/lib/supabase/types";

export function ServiceCard({
  service,
  selected,
  onSelect,
}: {
  service: Service;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
        selected
          ? "border-purple-500 bg-purple-50"
          : "border-gray-100 hover:border-gray-200"
      }`}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h4 className="font-medium text-gray-900">{service.name}</h4>
          {service.description && (
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{service.description}</p>
          )}
          <div className="flex items-center gap-3 mt-2 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {service.duration_minutes}분
            </span>
          </div>
        </div>
        <div className="text-right">
          {service.base_price && (
            <span className="font-bold text-purple-600">
              ฿{service.base_price.toLocaleString()}
            </span>
          )}
          {selected && (
            <div className="mt-2">
              <Check className="w-5 h-5 text-purple-500 ml-auto" />
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
