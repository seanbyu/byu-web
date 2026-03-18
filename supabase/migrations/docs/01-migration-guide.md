# Migration Guide

## 파일 목록 (실행 순서)

| 파일 | 설명 |
|------|------|
| `01_extensions_enums.sql` | PostgreSQL 확장 및 모든 ENUM 타입 정의 |
| `02_tables.sql` | 전체 테이블 스키마 (의존성 순서 준수) |
| `03_functions.sql` | 헬퍼 함수 및 RPC 함수 |
| `04_triggers.sql` | 트리거 함수 및 트리거 등록 |
| `05_rls.sql` | RLS 활성화 및 접근 정책 |
| `06_cron_storage.sql` | Storage 버킷, Realtime, pg_cron 작업 |
| `07_email_verifications.sql` | 이메일 OTP 인증 테이블 |
| `99_seed.sql` | 기본 시드 데이터 (industries) |

## 적용 방법

### 원격 DB (Supabase Dashboard)
파일 번호 순서대로 SQL Editor에 붙여넣어 실행.

### CLI
```bash
# 원격 DB에 마이그레이션 적용
npx supabase db push --db-url "postgresql://..."

# 로컬 DB 리셋 (전체 재적용)
npx supabase db reset
```

## 주의사항

1. **순서 필수**: 파일 번호 순서대로 실행해야 합니다 (FK 의존성)
2. **ENUM 변경**: 값 추가는 가능하지만 삭제·수정은 마이그레이션 필요
3. **RLS 활성화**: 모든 주요 테이블에 RLS가 활성화됩니다
4. `07_email_verifications.sql`은 Edge Function이 service_role로만 접근하므로 RLS 비활성화 상태입니다
