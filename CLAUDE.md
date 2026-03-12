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
