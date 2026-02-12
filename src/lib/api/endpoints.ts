import type { QueryParams } from "@/types";

export const endpoints = {
  // 살롱 (Salons)
  salons: {
    all: {
      path: () => "/salons",
      queryKey: (params?: QueryParams) => ["salons", params] as const,
    },
    detail: {
      path: (id: string) => `/salons/${id}`,
      queryKey: (id: string) => ["salons", id] as const,
    },
    // 살롱 서비스
    services: {
      path: (salonId: string) => `/salons/${salonId}/services`,
      queryKey: (salonId: string) => ["salons", salonId, "services"] as const,
    },
    // 살롱 서비스 카테고리
    categories: {
      path: (salonId: string) => `/salons/${salonId}/categories`,
      queryKey: (salonId: string) => ["salons", salonId, "categories"] as const,
    },
    // 살롱 스태프
    staff: {
      path: (salonId: string) => `/salons/${salonId}/staff`,
      queryKey: (salonId: string) => ["salons", salonId, "staff"] as const,
    },
    // 살롱 내 메뉴 (Menus in Salon)
    menus: {
      path: (salonId: string) => `/salons/${salonId}/menus`,
      queryKey: (salonId: string, params?: QueryParams) =>
        ["salons", salonId, "menus", params] as const,
    },
    // 살롱 내 예약 (Bookings)
    bookings: {
      path: (salonId: string) => `/salons/${salonId}/bookings`,
      queryKey: (salonId: string, params?: QueryParams) =>
        ["salons", salonId, "bookings", params] as const,
    },
  },

  // 예약 (Bookings)
  bookings: {
    // 예약 생성
    create: {
      path: () => "/bookings",
    },
    // 예약 상세
    detail: {
      path: (id: string) => `/bookings/${id}`,
      queryKey: (id: string) => ["bookings", id] as const,
    },
    // 디자이너별 예약 조회
    byDesigner: {
      path: (designerId: string) => `/bookings/designer/${designerId}`,
      queryKey: (designerId: string, date: string) =>
        ["bookings", "designer", designerId, date] as const,
    },
    // 살롱별 예약 조회
    bySalon: {
      path: (salonId: string) => `/bookings/salon/${salonId}`,
      queryKey: (salonId: string, date: string) =>
        ["bookings", "salon", salonId, date] as const,
    },
    // 예약 취소
    cancel: {
      path: (id: string) => `/bookings/${id}/cancel`,
    },
  },

  // 고객 (Customers)
  customers: {
    // 고객 찾기 또는 생성
    findOrCreate: {
      path: () => "/customers/find-or-create",
    },
  },
} as const;
