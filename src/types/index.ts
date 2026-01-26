export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// API 쿼리 파라미터 타입
export type QueryParams = Record<string, string | number | boolean | undefined>;

// API 요청 바디 타입 - 객체, 배열, 또는 null 허용
export type RequestBody = object | unknown[] | null;
