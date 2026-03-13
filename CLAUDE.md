# BYU Web — Claude Code 프로젝트 규칙

## 기술 스택
- Next.js (App Router) + TypeScript
- Tailwind CSS + next-intl (ko / en / th)
- React Query (TanStack Query v5)

---

## 공통 훅 규칙

### 모달 / 바텀시트 — 반드시 `useScrollLock` 사용
모달이나 바텀시트가 열릴 때 배경 스크롤을 막아야 한다.
iOS Safari는 `overflow: hidden`이 동작하지 않으므로 반드시 `useScrollLock` 훅을 사용한다.

```ts
import { useScrollLock } from "@/hooks/useScrollLock";

// isOpen prop이 있는 경우
useScrollLock(isOpen);

// 컴포넌트 자체가 열릴 때만 렌더링되는 경우 (항상 잠금)
useScrollLock(true);
```

훅 위치: `src/hooks/useScrollLock.ts`

---

## 모바일 UX 규칙

### 스크롤 컨테이너
- 페이지 전체가 div 스크롤인 경우 `h-dvh overflow-y-auto overscroll-none` 사용
- body 스크롤 페이지는 `html { overscroll-behavior: none }` (globals.css에 설정됨)

### iOS 줌 방지
- 모바일 input은 `font-size: 1rem` 이상 유지 (`text-sm` 사용 금지)
- globals.css의 `@media (max-width: 640px) and (pointer: coarse)` 규칙으로 글로벌 설정됨

### 터치 설정 (globals.css 전역 적용)
- `overscroll-behavior: none` — 당겨서 새로고침 / 바운스 방지
- `-webkit-tap-highlight-color: transparent` — 터치 하이라이트 제거
- `touch-action: pan-y` — 세로 스크롤만 허용

---

## i18n 규칙
- 번역 키 추가 시 ko / en / th 3개 파일 항상 동시 수정
- 파일 위치: `src/messages/{locale}/`

---

## YouTube 영상 (스타일링북)
- 영상 추가: `CATEGORY_VIDEOS` 객체에 URL 추가 (SearchView, StylingBookView 양쪽 동일하게)
- 지원 URL 형식: `youtu.be/xxx`, `youtube.com/watch?v=xxx`, `youtube.com/shorts/xxx`
- 재생 방식: IntersectionObserver(400px 미리 로드) + postMessage playVideo
- Shorts 비율: `aspect-[9/16]`

---

## 이미지 규칙

### 반드시 `next/image` 사용
모든 이미지는 `<img>` 대신 Next.js `<Image>`를 사용한다.
- 자동 WebP 변환, 디바이스 맞춤 리사이즈, 지연 로딩 제공
- YouTube 썸네일 등 외부 제어 불가한 경우만 예외 (`// eslint-disable-next-line`)

```tsx
import Image from "next/image";

// fill 모드 (부모에 position: relative + 명시적 높이 필요)
<div className="relative h-28">
  <Image fill src={url} alt={alt} className="object-cover" sizes="100vw" />
</div>
```

### `sizes` prop 필수
```tsx
sizes="(max-width: 640px) 100vw, 50vw"  // 일반 카드
sizes="100vw"                            // 풀스크린 배너
sizes="140px"                            // 고정 너비 컴포넌트
```

### LCP 이미지 — `priority` prop 추가
첫 번째로 보이는 이미지(히어로 배너, 첫 번째 카드 등)에 반드시 추가한다.
```tsx
<Image fill src={url} alt={alt} priority sizes="100vw" />
```

### StorageImage 컴포넌트
여러 확장자 fallback이 필요한 경우 `StorageImage` 사용 (`src/components/ui/StorageImage.tsx`).
- `priority`, `sizes` prop 지원
- URL 순서: jpg → jpeg → png → webp (카메라 사진 대부분 JPEG)
- 부모 컨테이너에 `position: relative`와 명시적 높이 필요

---

## 성능 규칙

### 폰트
- Noto Sans KR / Noto Sans Thai: `weight: ["400", "700"]`만 로드 (weight 추가 금지)
- 폰트 추가 시 `display: "swap"` 필수

### 접근성 (Accessibility)
- `<button>`에 텍스트 없이 아이콘만 있는 경우 반드시 `aria-label` 추가
- 비활성 UI 텍스트 색상: `text-gray-500` 이상 사용 (`text-gray-400` 금지 — contrast ratio 미달)
- 바텀 네비게이션 비활성 상태: `text-gray-500`

### 번들 분석
```bash
ANALYZE=true pnpm build
```
`@next/bundle-analyzer` 설정됨 (`next.config.js`)
