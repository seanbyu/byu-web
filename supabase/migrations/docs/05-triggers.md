# 트리거

> 파일: `04_triggers.sql`

---

## updated_at 자동 갱신

모든 주요 테이블에 `BEFORE UPDATE` 트리거로 `update_updated_at()` 함수 적용.

적용 테이블: `users`, `salons`, `staff_positions`, `staff_profiles`, `customers`, `service_categories`, `services`, `service_position_prices`, `bookings`, `reviews`, `notifications`, `notification_outbox`, `salon_line_settings`, `payments`, `salon_promptpay_settings`, `membership_plans`, `customer_memberships`, `customer_cycles`, `message_jobs`, `user_identities`, `customer_filters`

---

## 고객 통계 자동 갱신

### `trg_update_no_show_count` (bookings AFTER UPDATE)
- 예약 상태가 `NO_SHOW`로 변경 → `customers.no_show_count + 1`
- `NO_SHOW`에서 다른 상태로 변경 → `customers.no_show_count - 1` (최소 0)

### `trg_update_total_spent` (bookings AFTER UPDATE)
- `payment_status`가 `PAID`로 변경 → `customers.total_spent + total_price`
- `PAID`에서 `REFUNDED`로 변경 → `customers.total_spent - total_price` (최소 0)

### `trg_update_total_spent_insert` (bookings AFTER INSERT)
- 예약 생성 시 `payment_status = PAID`면 즉시 `customers.total_spent` 반영

### `trg_update_last_visit` (bookings AFTER UPDATE)
- 예약 상태가 `COMPLETED`로 변경 → `customers.last_visit`, `customers.total_visits + 1` 갱신

---

## 신규 사용자 자동 프로필 생성

### `on_auth_user_created` (auth.users AFTER INSERT)
`handle_new_auth_user()` 실행:
1. `users` 테이블에 행 삽입 (`raw_user_meta_data` 기반 user_type/role/auth_provider 설정)
2. `user_type = SALON`이면 `staff_profiles`도 자동 생성 (살롱 영업시간 기반 work_schedule 초기화)

**raw_user_meta_data 지원 필드:**
- `user_type`, `role`, `salon_id`, `is_owner`, `is_approved`
- `name`, `phone`, `auth_provider`, `provider_user_id`
- LINE: `line_display_name`, `line_picture_url`, `line_status_message`

---

## 살롱 생성 시 기본 필터 시드

### `after_salon_insert_seed_customer_filters` (salons AFTER INSERT)
살롱 생성 시 `seed_default_customer_filters()` 자동 호출 → 기본 고객 필터 6개 생성.

---

## 고객 전화번호 정규화

### `trg_normalize_customer_phone` (customers BEFORE INSERT OR UPDATE)
`customers.phone` 변경 시 `phone_normalized` 자동 생성 (숫자와 `+`만 남김).

---

## 예약금 자동 몰수

### `trg_forfeit_deposit_on_no_show` (bookings BEFORE UPDATE)
예약 상태가 `NO_SHOW`로 변경되고 `deposit_status = PAID`면:
- `deposit_status → FORFEITED`
- `deposit_forfeited_at = NOW()`
- `deposit_notes`에 사유 자동 추가

---

## 재방문 주기 자동 갱신

### `trg_booking_completed` (bookings BEFORE UPDATE)
예약 상태가 `COMPLETED`로 변경 시:
1. `customer_cycles` upsert — `last_completed_at`, `next_due_at` 갱신
2. `cycle_days`는 커스텀 설정이 있으면 유지, 없으면 서비스 기본값 사용

---

## User Identity 관리

### `trg_ensure_single_primary_identity` (user_identities AFTER INSERT OR UPDATE)
`is_primary = true`로 변경 시:
- 해당 유저의 다른 identity는 `is_primary = false`로 변경
- `users.primary_identity_id` 갱신

---

## 예약 알림 트리거

### `trg_booking_inserted` (bookings AFTER INSERT)
새 예약 생성 → 살롱 오너에게 `BOOKING_REQUEST` IN_APP 알림.

### `trg_booking_rescheduled` (bookings AFTER UPDATE)
`booking_meta.reschedule_pending = true`로 변경 시 → 살롱 오너에게 `BOOKING_MODIFIED` IN_APP 알림.

### `trg_booking_status_changed` (bookings AFTER UPDATE)
상태가 `CONFIRMED` 또는 `CANCELLED`로 변경 시:
1. **LINE 발송** (`line_user_id` 있고 opt_out=false, line_blocked=false인 경우):
   - `notifications` + `notification_outbox` 동시 생성 (트랜잭셔널 아웃박스)
   - idempotency_key로 중복 방지
2. **고객 IN_APP 알림** (LINE 연동 여부 무관)
3. **취소 시 어드민 IN_APP** (어드민 직접 취소는 제외)
