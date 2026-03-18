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

// 지원하는 이미지 확장자 (jpg 우선 — 카메라 사진 대부분이 JPEG)
const IMAGE_EXTENSIONS = ['jpg', 'png'];

/**
 * 살롱 커버 이미지 URL 목록 생성
 * cover_image_url이 있으면 그것만, 없으면 storage 경로로 fallback
 * @param salonId - 살롱 ID
 * @param coverImageUrl - salons.cover_image_url (있으면 우선 사용)
 * @returns 커버 이미지 URL 배열
 */
export function getSalonCoverUrls(salonId: string, coverImageUrl?: string | null): string[] {
  if (coverImageUrl) return [getStorageUrl('salon-images', coverImageUrl)];
  return IMAGE_EXTENSIONS.map(ext =>
    getStorageUrl('salon-images', `${salonId}/cover/image.${ext}`)
  );
}

/**
 * 살롱 로고 이미지 URL 목록 생성
 * logo_url이 있으면 그것만, 없으면 storage 경로로 fallback
 * @param salonId - 살롱 ID
 * @param logoUrl - salons.logo_url (있으면 우선 사용)
 * @returns 로고 이미지 URL 배열
 */
export function getSalonLogoUrls(salonId: string, logoUrl?: string | null): string[] {
  if (logoUrl) return [getStorageUrl('salon-images', logoUrl)];
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
