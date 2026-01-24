import { apiClient } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { ApiResponse } from "@/types";

// TODO: Import shared type from @salon-admin/api-core or supabase
export interface SalonMenu {
  id: string;
  name: string;
  price: number;
  duration_minutes: number;
  // Add other fields as necessary
}

export const salonMenusApi = {
  getMenus: (
    salonId: string,
    categoryId?: string
  ): Promise<ApiResponse<SalonMenu[]>> => {
    const params: Record<string, string> = {};
    if (categoryId) {
      params.categoryId = categoryId;
    }
    return apiClient.get(endpoints.salons.menus.path(salonId), params);
  },
};
