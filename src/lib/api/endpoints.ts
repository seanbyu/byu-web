export const endpoints = {
  // 살롱 (Salons)
  salons: {
    all: {
      path: () => "/salons",
      queryKey: (params?: any) => ["salons", params] as const,
    },
    detail: {
      path: (id: string) => `/salons/${id}`,
      queryKey: (id: string) => ["salons", id] as const,
    },
    // 살롱 내 메뉴 (Menus in Salon)
    menus: {
      path: (salonId: string) => `/salons/${salonId}/menus`,
      queryKey: (salonId: string, params?: any) =>
        ["salons", salonId, "menus", params] as const,
    },
    // 살롱 내 예약 (Bookings)
    bookings: {
      path: (salonId: string) => `/salons/${salonId}/bookings`,
      queryKey: (salonId: string, params?: any) =>
        ["salons", salonId, "bookings", params] as const,
    },
  },
} as const;
