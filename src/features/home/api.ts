// TODO: Import actual types from @repo/api-core when available
import { SalonMenu } from "@/features/salon-menus/api";

export interface HomeData {
  banners: { id: string; imageUrl: string; link: string }[];
  trendingMenus: (SalonMenu & {
    shopName: string;
    discountRate: number;
    imageUrl: string;
    isLiked: boolean;
    dDay?: number;
  })[];
}

export const homeApi = {
  getHomeData: async (): Promise<HomeData> => {
    // Mock implementation for now
    return {
      banners: [],
      trendingMenus: [],
    };
  },
};
