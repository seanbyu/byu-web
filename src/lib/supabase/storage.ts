/**
 * Supabase Storage 헬퍼 함수
 *
 * Storage 구조:
 * salon-images/
 *   └── {salonId}/
 *         ├── logo/       ← 로고용
 *         ├── cover/      ← 매장 커버 이미지
 *         └── gallery/    ← 갤러리용
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

/**
 * Storage bucket의 public URL 생성
 * @param bucket - 버킷 이름
 * @param path - 파일 경로
 * @returns 전체 public URL
 */
export function getStorageUrl(bucket: string, path: string): string {
  // 이미 전체 URL인 경우 그대로 반환
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}

// 지원하는 이미지 확장자
const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp'];

/**
 * 살롱 커버 이미지 URL 목록 생성 (여러 확장자)
 * @param salonId - 살롱 ID
 * @returns 커버 이미지 URL 배열
 */
export function getSalonCoverUrls(salonId: string): string[] {
  return IMAGE_EXTENSIONS.map(ext =>
    getStorageUrl('salon-images', `${salonId}/cover/image.${ext}`)
  );
}

/**
 * 살롱 로고 이미지 URL 목록 생성 (여러 확장자)
 * @param salonId - 살롱 ID
 * @returns 로고 이미지 URL 배열
 */
export function getSalonLogoUrls(salonId: string): string[] {
  return IMAGE_EXTENSIONS.map(ext =>
    getStorageUrl('salon-images', `${salonId}/logo/image.${ext}`)
  );
}

/**
 * avatars 버킷에서 이미지 URL 생성
 */
export function getAvatarUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  return getStorageUrl('avatars', path);
}
