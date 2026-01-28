import { memo, useMemo } from "react";
import { Scissors } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Service, ServiceCategory } from "@/lib/supabase/types";
import { ServiceCard } from "./ServiceCard";

export const ServiceStep = memo(function ServiceStep({
  services,
  categories,
  selectedService,
  onSelect,
  t,
}: {
  services: Service[];
  categories: ServiceCategory[];
  selectedService: Service | null;
  onSelect: (service: Service) => void;
  t: ReturnType<typeof useTranslations>;
}) {
  const groupedServices = useMemo(() => {
    const uncategorized: Service[] = [];
    const categorized: Map<string, { category: ServiceCategory; services: Service[] }> = new Map();

    categories.forEach((cat) => {
      categorized.set(cat.id, { category: cat, services: [] });
    });

    services.forEach((service) => {
      if (service.category_id && categorized.has(service.category_id)) {
        categorized.get(service.category_id)!.services.push(service);
      } else {
        uncategorized.push(service);
      }
    });

    return { categorized: Array.from(categorized.values()), uncategorized };
  }, [services, categories]);

  return (
    <div>
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Scissors className="w-5 h-5 text-primary-500" />
        {t("selectService")}
      </h2>

      {groupedServices.categorized.map(({ category, services: catServices }) => (
        catServices.length > 0 && (
          <div key={category.id} className="mb-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">{category.name}</h3>
            <div className="space-y-2">
              {catServices.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  selected={selectedService?.id === service.id}
                  onSelect={() => onSelect(service)}
                />
              ))}
            </div>
          </div>
        )
      ))}

      {groupedServices.uncategorized.length > 0 && (
        <div className="space-y-2">
          {groupedServices.uncategorized.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              selected={selectedService?.id === service.id}
              onSelect={() => onSelect(service)}
            />
          ))}
        </div>
      )}

      {services.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          {t("noServices")}
        </div>
      )}
    </div>
  );
});
