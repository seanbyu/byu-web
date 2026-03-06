# Beauty By You — 에이전트 구성

## 구조

```
.clinerules          # 항상 로드 — 프로젝트 전체 컨텍스트 (베이스)
.agents/
├── lead.md          # 팀장 에이전트 (오케스트레이터)
├── frontend.md      # 프론트엔드 전문 에이전트
├── api.md           # API/BFF 전문 에이전트
├── data-layer.md    # 데이터 레이어 전문 에이전트
└── auth.md          # 인증/Supabase 전문 에이전트
```

## 사용법

Cline 대화 시작 시 `@` 파일 멘션으로 에이전트 활성화:

### 팀장 에이전트 (복잡한 기능 구현 시)
```
@.agents/lead.md
[기능 이름] 구현해줘: [요구사항 설명]
```
→ 팀장이 태스크 분해 후 각 에이전트에게 위임할 지시를 출력해줌

### 전문 에이전트 직접 호출 (단순 작업 시)
```
@.agents/frontend.md
살롱 상세 페이지에 리뷰 탭 추가해줘

@.agents/api.md
GET /api/bookings/my 응답에 살롱 이름 필드 추가해줘

@.agents/data-layer.md
useSalonDetailQuery에 staleTime 5분 설정 추가해줘

@.agents/auth.md
LIFF 로그인 후 customer 생성 실패 케이스 처리 추가해줘
```

## 에이전트 선택 가이드

| 요청 유형 | 사용할 에이전트 |
|---|---|
| 새 기능 전체 구현 | `lead.md` → 분해 후 각 전문 에이전트 |
| UI 컴포넌트 수정 | `frontend.md` |
| API 엔드포인트 추가/수정 | `api.md` |
| React Query 훅 추가 | `data-layer.md` |
| Zustand 스토어 수정 | `data-layer.md` |
| LINE 로그인 관련 | `auth.md` |
| Supabase RLS 관련 | `auth.md` |
| 기능 전반 리팩토링 | `lead.md` |
