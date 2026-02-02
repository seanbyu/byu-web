/**
 * Salons API 공통 타입 정의
 */

/**
 * [salonId] 동적 라우트 파라미터 타입
 */
export type SalonIdParams = {
  params: Promise<{ salonId: string }>;
};
