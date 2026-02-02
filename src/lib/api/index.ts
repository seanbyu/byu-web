/**
 * API Module
 * 클라이언트 사이드 API 레이어 통합 export
 */

// Client
export { apiClient } from "./client";

// Endpoints
export { endpoints } from "./endpoints";

// Queries (GET)
export { bookingQueries, salonQueries } from "./queries";

// Mutations (POST/PUT/DELETE)
export { bookingMutations } from "./mutations";
export type { CreateBookingParams, CancelBookingParams } from "./mutations";
