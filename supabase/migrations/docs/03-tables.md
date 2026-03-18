# 테이블 스키마

> 파일: `02_tables.sql`, `07_email_verifications.sql`

---

## 살롱 도메인

### `industries` — 업종
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| name | TEXT | 업종명 (HAIR, NAIL, ESTHETIC, MASSAGE, BARBERSHOP) |

### `salons` — 살롱
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| name | TEXT | 살롱명 |
| description | TEXT | 설명 |
| phone | TEXT | 연락처 |
| email | TEXT | 이메일 |
| address | TEXT | 주소 |
| city | TEXT | 도시 |
| state / postal_code | TEXT | 주/우편번호 |
| country | TEXT | 국가 (기본: TH) |
| latitude / longitude | DECIMAL | 좌표 |
| business_hours | JSONB | 영업시간 (요일별 enabled/open/close) |
| holidays | JSONB | 휴무일 배열 |
| logo_url | TEXT | 로고 이미지 URL |
| cover_image_url | TEXT | 커버 이미지 URL |
| settings | JSONB | 설정 (booking_advance_days 등) |
| plan_type | TEXT | 구독 플랜 (FREE 기본) |
| approval_status | ENUM | pending/approved/rejected |
| is_active | BOOLEAN | 활성 여부 (기본 true) |
| deleted_at | TIMESTAMPTZ | 소프트 삭제 |

**settings JSONB 구조:**
```json
{
  "booking_advance_days": 30,
  "booking_cancellation_hours": 24,
  "slot_duration_minutes": 30,
  "currency": "THB",
  "timezone": "Asia/Bangkok"
}
```

### `salon_industries` — 살롱↔업종 (M:N)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| salon_id | UUID | FK → salons |
| industry_id | UUID | FK → industries |
| display_order | INTEGER | 표시 순서 |

### `salon_images` — 살롱 갤러리 이미지
| 컬럼 | 타입 | 설명 |
|------|------|------|
| salon_id | UUID | FK → salons |
| image_url | TEXT | 이미지 URL |
| caption | TEXT | 설명 |
| display_order | INTEGER | 표시 순서 |

---

## 사용자 도메인

### `users` — 통합 사용자
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK (auth.users 참조) |
| user_type | ENUM | SALON / CUSTOMER |
| role | ENUM | SUPER_ADMIN/ADMIN/MANAGER/ARTIST/STAFF/CUSTOMER |
| email | TEXT | 이메일 (UNIQUE) |
| name | TEXT | 이름 |
| phone | TEXT | 전화번호 |
| profile_image | TEXT | 프로필 이미지 URL |
| customer_id | UUID | FK → customers (LINE 고객 연결) |
| primary_identity_id | UUID | FK → user_identities (주 로그인 수단) |
| is_active | BOOLEAN | 활성 여부 |
| deleted_at | TIMESTAMPTZ | 소프트 삭제 |

> **제약**: user_type=SALON이면 role은 SUPER_ADMIN/ADMIN/MANAGER/ARTIST/STAFF 중 하나. user_type=CUSTOMER이면 role=CUSTOMER 고정.

### `user_identities` — 소셜 로그인 연동
| 컬럼 | 타입 | 설명 |
|------|------|------|
| user_id | UUID | FK → users |
| auth_id | UUID | auth.users.id (UNIQUE) |
| provider | ENUM | EMAIL/LINE/GOOGLE/KAKAO |
| provider_user_id | TEXT | 소셜 플랫폼 유저 ID |
| profile | JSONB | 소셜 프로필 (displayName, pictureUrl 등) |
| is_primary | BOOLEAN | 주 로그인 수단 여부 |
| last_used_at | TIMESTAMPTZ | 마지막 로그인 시각 |

> 유저당 동일 provider는 1개만 허용 (`unique_user_provider` 제약)

---

## 직원 도메인

### `staff_positions` — 직급
| 컬럼 | 타입 | 설명 |
|------|------|------|
| salon_id | UUID | FK → salons |
| name / name_en / name_th | TEXT | 직급명 (다국어) |
| level | INTEGER | 직급 레벨 (1=최하위, 높을수록 가격 높음) |
| display_order | INTEGER | 표시 순서 |
| is_active | BOOLEAN | 활성 여부 |

### `staff_profiles` — 직원 프로필
| 컬럼 | 타입 | 설명 |
|------|------|------|
| user_id | UUID | PK, FK → users |
| salon_id | UUID | FK → salons |
| is_owner | BOOLEAN | 살롱 대표 여부 (살롱당 1명 UNIQUE) |
| is_approved | BOOLEAN | 승인 여부 |
| position_id | UUID | FK → staff_positions |
| is_booking_enabled | BOOLEAN | 예약 수령 가능 여부 |
| permissions | JSONB | 권한 설정 |
| work_schedule | JSONB | 근무 스케줄 (요일별) |
| holidays | JSONB | 휴가 날짜 배열 |
| bio | TEXT | 소개 |
| specialties | TEXT[] | 전문 시술 |
| years_of_experience | INTEGER | 경력 |
| social_links | JSONB | SNS 링크 |
| display_order | INTEGER | 예약 UI 표시 순서 |

---

## 고객 도메인

### `customers` — 고객
| 컬럼 | 타입 | 설명 |
|------|------|------|
| salon_id | UUID | FK → salons |
| user_id | UUID | FK → users (LINE 로그인 연결) |
| primary_artist_id | UUID | 담당 아티스트 |
| name | VARCHAR | 이름 |
| phone / email | VARCHAR | 연락처 |
| customer_type | ENUM | local / foreign |
| customer_number | VARCHAR | 고객번호 (살롱별 UNIQUE, gap-filling) |
| phone_normalized | VARCHAR | 정규화 전화번호 (트리거 자동 생성) |
| notes | TEXT | 고객 메모 (공개) |
| internal_notes | TEXT | 내부 메모 (스태프 전용) |
| last_visit | DATE | 최근 방문일 (자동 갱신) |
| total_visits | INTEGER | 총 방문 횟수 (자동 갱신) |
| total_spent | DECIMAL | 총 매출 (자동 갱신) |
| no_show_count | INTEGER | 노쇼 횟수 (자동 갱신) |
| line_user_id | TEXT | LINE User ID |
| line_blocked | BOOLEAN | LINE 차단 여부 (webhook 자동 갱신) |
| opt_out | BOOLEAN | LINE 메시지 수신 거부 |
| acquisition_meta | JSONB | 마케팅 유입 정보 |
| birth_date | DATE | 생년월일 |
| gender | ENUM | 성별 |
| tags | ENUM[] | 고객 태그 |
| grade | ENUM | 고객 등급 |
| is_blacklisted | BOOLEAN | 블랙리스트 여부 |

### `customer_groups` — 고객 그룹
| 컬럼 | 타입 | 설명 |
|------|------|------|
| salon_id | UUID | FK → salons |
| name | TEXT | 그룹명 |
| group_type | ENUM | MANUAL/AUTO/HYBRID |
| auto_assign_rules | JSONB | 자동 분류 규칙 |
| is_active | BOOLEAN | 활성 여부 |

### `customer_group_members` — 그룹 멤버
| 컬럼 | 타입 | 설명 |
|------|------|------|
| group_id | UUID | FK → customer_groups |
| customer_id | UUID | FK → customers |
| assigned_by | UUID | FK → users |
| is_auto_assigned | BOOLEAN | 자동 할당 여부 |

### `customer_filters` — 고객 필터
| 컬럼 | 타입 | 설명 |
|------|------|------|
| salon_id | UUID | FK → salons |
| filter_key | TEXT | 필터 키 (all/new/returning/regular 등) |
| is_system_filter | BOOLEAN | 시스템 기본 필터 여부 |
| label / label_en / label_th | TEXT | 다국어 라벨 |
| conditions | JSONB | 필터 조건 배열 |
| display_order | INTEGER | 표시 순서 |

> 살롱 생성 시 트리거에 의해 기본 필터 자동 시드됨 (all/new/returning/regular/dormant/vip)

### `customer_cycles` — 재방문 주기
| 컬럼 | 타입 | 설명 |
|------|------|------|
| salon_id / customer_id / service_id | UUID | 복합 PK |
| cycle_days | INTEGER | 재방문 주기 (일) |
| last_completed_at | TIMESTAMPTZ | 마지막 완료 시각 |
| next_due_at | TIMESTAMPTZ | 다음 재방문 예정일 |

---

## 서비스 도메인

### `service_categories` — 서비스 카테고리
| 컬럼 | 타입 | 설명 |
|------|------|------|
| salon_id | UUID | FK → salons |
| industry_id | UUID | FK → industries |
| name | TEXT | 카테고리명 |
| display_order | INTEGER | 표시 순서 |
| is_active | BOOLEAN | 활성 여부 |
| deleted_at | TIMESTAMPTZ | 소프트 삭제 |

### `services` — 서비스
| 컬럼 | 타입 | 설명 |
|------|------|------|
| salon_id | UUID | FK → salons |
| category_id | UUID | FK → service_categories |
| name / name_en | TEXT | 서비스명 |
| description | TEXT | 설명 |
| base_price | DECIMAL | 기본 가격 |
| duration_minutes | INTEGER | 기본 시술 시간 |
| default_cycle_days | INTEGER | 기본 재방문 주기 |
| is_active | BOOLEAN | 활성 여부 |
| display_order | INTEGER | 표시 순서 |
| deleted_at | TIMESTAMPTZ | 소프트 삭제 |

### `service_position_prices` — 직급별 가격
| 컬럼 | 타입 | 설명 |
|------|------|------|
| service_id | UUID | FK → services |
| position_id | UUID | FK → staff_positions |
| price | DECIMAL | 직급별 가격 |
| duration_minutes | INTEGER | 직급별 시술 시간 |

---

## 예약 도메인

### `bookings` — 예약
| 컬럼 | 타입 | 설명 |
|------|------|------|
| salon_id | UUID | FK → salons |
| customer_id | UUID | FK → customers |
| artist_id | UUID | FK → users (담당 아티스트) |
| service_id | UUID | FK → services |
| booking_date | DATE | 예약일 |
| start_time / end_time | TIME | 시술 시간 |
| duration_minutes | INTEGER | 시술 시간(분) |
| status | ENUM | 예약 상태 |
| payment_status | ENUM | 결제 상태 |
| total_price | DECIMAL | 총 금액 |
| additional_charges | DECIMAL | 추가 금액 |
| discount | DECIMAL | 할인 금액 |
| customer_notes | TEXT | 고객 요청사항 |
| confirmed_by / confirmed_at | UUID/TIMESTAMPTZ | 확정 정보 |
| cancelled_by / cancelled_at | UUID/TIMESTAMPTZ | 취소 정보 |
| cancellation_reason | TEXT | 취소 사유 |
| completed_at | TIMESTAMPTZ | 완료 시각 |
| deposit_* | 여러 컬럼 | 예약금 관련 (하단 참조) |
| membership_id / membership_usage_id | UUID | 정액권 연결 |
| booking_meta | JSONB | 채널, 디바이스, 재일정 여부 등 |

**deposit 컬럼:**
- `deposit_required` — 예약금 필요 여부
- `deposit_amount` — 예약금액
- `deposit_status` — 예약금 상태 (ENUM)
- `deposit_payment_method` — 결제 수단
- `deposit_paid_at / deposit_expires_at / deposit_forfeited_at / deposit_refunded_at`
- `deposit_transaction_id / deposit_notes / deposit_refund_amount`
- `deposit_exempt_by_membership` — 정액권 예약금 면제 여부

---

## 리뷰 도메인

### `reviews` — 리뷰
| 컬럼 | 타입 | 설명 |
|------|------|------|
| booking_id | UUID | FK → bookings (UNIQUE) |
| salon_id / customer_id / artist_id | UUID | 관련 엔티티 |
| rating | INTEGER | 별점 (1~5) |
| comment | TEXT | 리뷰 내용 |
| is_visible | BOOLEAN | 공개 여부 |
| rating_cleanliness / rating_kindness / rating_skill / rating_value | DECIMAL | 세부 평점 |
| tags | TEXT[] | 리뷰 태그 |
| like_count | INTEGER | 좋아요 수 (자동 갱신) |

### `review_likes` — 리뷰 좋아요
| 컬럼 | 타입 | 설명 |
|------|------|------|
| review_id | UUID | FK → reviews |
| user_id | UUID | FK → users |

### `review_reports` — 리뷰 신고
| 컬럼 | 타입 | 설명 |
|------|------|------|
| review_id | UUID | FK → reviews |
| reporter_id | UUID | FK → users |
| reason | TEXT | 신고 사유 |
| status | ENUM | PENDING/REVIEWING/RESOLVED/DISMISSED |

---

## 알림 도메인

### `notifications` — 알림 기록
| 컬럼 | 타입 | 설명 |
|------|------|------|
| salon_id | UUID | FK → salons |
| booking_id | UUID | FK → bookings |
| recipient_type | ENUM | 수신자 유형 |
| recipient_user_id / recipient_customer_id | UUID | 수신자 |
| notification_type | ENUM | 알림 종류 |
| channel | ENUM | 발송 채널 |
| title / body | TEXT | 알림 내용 |
| status | ENUM | 발송 상태 |
| metadata | JSONB | 알림 변수 |

> Realtime 활성화 → `ALTER TABLE notifications REPLICA IDENTITY FULL`

### `notification_outbox` — 발송 큐
LINE 발송 트랜잭셔널 아웃박스 패턴. `claim_outbox_batch()` 함수로 원자적 처리.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| notification_id | UUID | FK → notifications |
| idempotency_key | TEXT | 중복 발송 방지 키 (UNIQUE) |
| status | ENUM | outbox_status |
| retry_count | INTEGER | 재시도 횟수 |
| next_retry_at | TIMESTAMPTZ | 다음 재시도 시각 |
| payload | JSONB | 발송 데이터 |

### `salon_line_settings` — 살롱 LINE 설정
| 컬럼 | 타입 | 설명 |
|------|------|------|
| salon_id | UUID | FK → salons (UNIQUE) |
| line_channel_id | TEXT | LINE Channel ID |
| line_channel_secret | TEXT | Channel Secret |
| line_channel_access_token | TEXT | Access Token |
| liff_id | TEXT | LIFF App ID |
| is_active / is_verified | BOOLEAN | 활성화/검증 여부 |

---

## 결제 도메인

### `payments` — 결제 기록
| 컬럼 | 타입 | 설명 |
|------|------|------|
| booking_id | UUID | FK → bookings |
| salon_id | UUID | FK → salons |
| customer_id | UUID | FK → customers |
| payment_type | ENUM | 결제 유형 |
| amount | DECIMAL | 금액 |
| payment_method | ENUM | 결제 수단 |
| status | ENUM | 결제 상태 |
| transaction_id | TEXT | 거래 ID |
| processed_by | UUID | 처리한 스태프 |

### `salon_promptpay_settings` — PromptPay 설정
| 컬럼 | 타입 | 설명 |
|------|------|------|
| salon_id | UUID | FK → salons (UNIQUE) |
| promptpay_id | TEXT | PromptPay ID |
| account_name | TEXT | 계좌명 |
| is_active | BOOLEAN | 활성 여부 |

---

## 정액권 도메인

### `membership_plans` — 정액권 플랜
| 컬럼 | 타입 | 설명 |
|------|------|------|
| salon_id | UUID | FK → salons |
| name | TEXT | 플랜명 |
| membership_type | ENUM | COUNT_BASED/TIME_BASED/AMOUNT_BASED/BUNDLE |
| price | DECIMAL | 판매가 |
| total_count | INTEGER | 총 횟수 (횟수제) |
| validity_days | INTEGER | 유효기간(일) |
| total_amount | DECIMAL | 충전금액 (금액권) |
| activation_type | ENUM | IMMEDIATE/FIRST_USE |
| all_services | BOOLEAN | 전체 서비스 적용 여부 |
| applicable_service_ids | UUID[] | 적용 서비스 |
| deposit_exempt | BOOLEAN | 예약금 면제 여부 |
| is_active | BOOLEAN | 판매 여부 |

### `customer_memberships` — 고객 보유 정액권
| 컬럼 | 타입 | 설명 |
|------|------|------|
| customer_id | UUID | FK → customers |
| plan_id | UUID | FK → membership_plans |
| salon_id | UUID | FK → salons |
| status | ENUM | 정액권 상태 |
| remaining_count | INTEGER | 잔여 횟수 |
| remaining_amount | DECIMAL | 잔여 금액 |
| used_count | INTEGER | 사용 횟수 |
| used_amount | DECIMAL | 사용 금액 |
| starts_at / expires_at | TIMESTAMPTZ | 유효 기간 |
| activation_type | ENUM | IMMEDIATE/FIRST_USE |

### `membership_usages` — 정액권 사용 내역
| 컬럼 | 타입 | 설명 |
|------|------|------|
| membership_id | UUID | FK → customer_memberships |
| booking_id | UUID | FK → bookings |
| service_id | UUID | FK → services |
| count_used / amount_used | INTEGER/DECIMAL | 사용량 |
| remaining_count_after / remaining_amount_after | INTEGER/DECIMAL | 사용 후 잔여 |
| is_cancelled | BOOLEAN | 취소 여부 |

---

## 즐겨찾기

### `user_favorite_salons` — 살롱 즐겨찾기
| 컬럼 | 타입 | 설명 |
|------|------|------|
| user_id | UUID | FK → users |
| salon_id | UUID | FK → salons |

### `user_favorite_artists` — 아티스트 즐겨찾기
| 컬럼 | 타입 | 설명 |
|------|------|------|
| user_id | UUID | FK → users |
| artist_id | UUID | FK → users |
| salon_id | UUID | FK → salons |

---

## LINE 자동화

### `message_jobs` — LINE 메시지 발송 작업
| 컬럼 | 타입 | 설명 |
|------|------|------|
| salon_id | UUID | FK → salons |
| customer_id | UUID | FK → customers |
| job_type | TEXT | rebook_due/rebook_overdue/reminder_24h/reminder_3h |
| status | TEXT | pending/sent/failed/skipped |
| sent_at | TIMESTAMPTZ | 발송 시각 |

### `message_events` — 메시지 이벤트 트래킹
| 컬럼 | 타입 | 설명 |
|------|------|------|
| message_job_id | UUID | FK → message_jobs |
| event_type | TEXT | clicked/converted |

---

## 인증

### `email_verifications` — 이메일 OTP 인증
| 컬럼 | 타입 | 설명 |
|------|------|------|
| email | TEXT | 인증 이메일 |
| code | TEXT | OTP 코드 |
| expires_at | TIMESTAMPTZ | 만료 시각 |
| verified_at | TIMESTAMPTZ | 인증 완료 시각 |

> RLS 비활성화 — Edge Function이 service_role로만 접근
