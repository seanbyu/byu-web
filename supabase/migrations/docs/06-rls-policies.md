# RLS 정책

> 파일: `05_rls.sql`

---

## 역할 계층

```
SUPER_ADMIN > ADMIN > MANAGER > ARTIST/STAFF > CUSTOMER
```

## 표기 설명
| 표기 | 설명 |
|------|------|
| 모두 | 로그인 불필요 (anon 포함) |
| 인증 유저 | auth.uid() 존재 |
| 본인 | 해당 레코드 소유자 |
| 스태프 | ARTIST, STAFF 이상 |
| 매니저+ | MANAGER 이상 |
| 관리자 | ADMIN 이상 |
| 살롱 스태프 | 같은 살롱 소속 스태프 |

---

## 정책 요약

| 테이블 | SELECT | INSERT | UPDATE | DELETE |
|--------|--------|--------|--------|--------|
| industries | 모두 | - | - | - |
| salon_industries | 모두 | 살롱 관리자 | 살롱 관리자 | 살롱 관리자 |
| salon_images | 모두 | 살롱 관리자 | 살롱 관리자 | 살롱 관리자 |
| salons | 모두 (is_active=true) | - | 살롱 관리자 / SUPER_ADMIN | - |
| users | 본인 + 같은 살롱 | - | 본인 | - |
| staff_profiles | 본인 + 같은 살롱 | 살롱 관리자 | 관리자 | - |
| staff_positions | 살롱 스태프 | 관리자 | 관리자 | 관리자 |
| customers | 본인 + 살롱 스태프 | 스태프 | 스태프 | 매니저+ |
| customer_groups | 살롱 스태프 | 매니저+ | 매니저+ | 매니저+ |
| customer_group_members | 살롱 스태프 | 스태프 | 스태프 | 스태프 |
| customer_filters | 살롱 스태프 | 살롱 스태프 | 살롱 스태프 | 매니저+ |
| service_categories | 모두 (is_active) | 관리자 | 관리자 | - |
| services | 모두 (is_active) | 관리자 | 관리자 | - |
| service_position_prices | 모두 | 관리자 | 관리자 | 관리자 |
| bookings | 본인 + 담당자 + 살롱 스태프 | 고객 / 스태프 | 스태프 | - |
| reviews | 모두 (is_visible) | 예약 고객 | 본인 / 살롱 관리자 | - |
| review_likes | 모두 | 인증 유저 | - | 본인 |
| review_reports | 본인 + 살롱 관리자 | 인증 유저 | 관리자 | - |
| notifications | 본인 + 살롱 스태프 | 스태프 | - | - |
| notification_outbox | 없음 (service_role 전용) | - | - | - |
| salon_line_settings | 살롱 관리자 | 관리자 | 관리자 | - |
| payments | 본인 + 살롱 스태프 | 스태프 | 매니저+ | - |
| salon_promptpay_settings | 살롱 관리자 | 관리자 | 관리자 | 관리자 |
| membership_plans | 살롱 스태프 | 매니저+ | 매니저+ | 매니저+ |
| customer_memberships | 본인 + 살롱 스태프 | 스태프 | 스태프 | 매니저+ |
| membership_usages | 살롱 스태프 | 스태프 | 스태프 | - |
| customer_cycles | 살롱 스태프 | 스태프 | 스태프 | - |
| user_favorite_salons | 본인 / 살롱 관리자 | 본인 | - | 본인 |
| user_favorite_artists | 본인 | 본인 | - | 본인 |
| message_jobs | 살롱 스태프 | service_role | service_role | service_role |
| message_events | 살롱 스태프 | service_role | - | - |

---

## 스키마 권한

```sql
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
```
