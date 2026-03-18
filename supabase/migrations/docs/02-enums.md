# ENUM 타입 정의

> 파일: `01_extensions_enums.sql`

## 사용자 관련

### `user_type`
| 값 | 설명 |
|----|------|
| `SALON` | 살롱 측 사용자 (ADMIN, MANAGER, ARTIST, STAFF) |
| `CUSTOMER` | 고객 (LINE 예약 고객) |

### `user_role`
| 값 | 설명 |
|----|------|
| `SUPER_ADMIN` | 플랫폼 전체 관리자 |
| `ADMIN` | 살롱 오너 (가입 시 기본) |
| `MANAGER` | 살롱 매니저 |
| `ARTIST` | 아티스트/디자이너 (시술 담당) |
| `STAFF` | 일반 스태프 |
| `CUSTOMER` | 고객 |

> **규칙**: `user_type = SALON` → role은 SUPER_ADMIN/ADMIN/MANAGER/ARTIST/STAFF 중 하나
> `user_type = CUSTOMER` → role은 CUSTOMER 고정

### `auth_provider`
`EMAIL` / `LINE` / `GOOGLE` / `KAKAO`

---

## 살롱 관련

### `approval_status_type`
| 값 | 설명 |
|----|------|
| `pending` | 승인 대기 (기본값) |
| `approved` | 승인됨 |
| `rejected` | 거절됨 |

---

## 예약 관련

### `booking_status`
| 값 | 설명 |
|----|------|
| `PENDING` | 예약 대기 |
| `CONFIRMED` | 예약 확정 |
| `IN_PROGRESS` | 시술 중 |
| `COMPLETED` | 완료 |
| `CANCELLED` | 취소 |
| `NO_SHOW` | 노쇼 |

### `payment_status`
`PENDING` / `PAID` / `REFUNDED` / `FAILED`

### `deposit_status`
| 값 | 설명 |
|----|------|
| `NOT_REQUIRED` | 예약금 불필요 |
| `PENDING` | 결제 대기 |
| `PAID` | 결제 완료 |
| `PARTIALLY_REFUNDED` | 부분 환불 |
| `REFUNDED` | 전액 환불 |
| `FORFEITED` | 몰수 (노쇼/취소) |

### `payment_method`
`CASH` / `CREDIT_CARD` / `DEBIT_CARD` / `BANK_TRANSFER` / `PROMPTPAY` / `LINE_PAY` / `TRUE_MONEY` / `RABBIT_LINE_PAY` / `SHOPEE_PAY` / `OTHER`

### `payment_type`
`DEPOSIT` / `FULL_PAYMENT` / `PARTIAL_PAYMENT` / `REFUND` / `ADDITIONAL`

### `payment_transaction_status`
`PENDING` / `PROCESSING` / `COMPLETED` / `FAILED` / `CANCELLED` / `REFUNDED`

---

## 알림 관련

### `notification_type`
| 값 | 수신자 | 설명 |
|----|--------|------|
| `BOOKING_REQUEST` | 어드민 | 예약 요청 |
| `BOOKING_CONFIRMED` | 고객 | 예약 확정 |
| `BOOKING_CANCELLED` | 양쪽 | 예약 취소 |
| `BOOKING_REMINDER` | 고객 | 예약 리마인더 |
| `BOOKING_COMPLETED` | 고객 | 시술 완료 (리뷰 요청) |
| `BOOKING_NO_SHOW` | 어드민 | 노쇼 알림 |
| `BOOKING_MODIFIED` | 양쪽 | 예약 변경 |
| `REVIEW_RECEIVED` | 어드민 | 리뷰 등록 |
| `GENERAL` | - | 일반 알림 |

### `notification_channel`
`LINE` / `EMAIL` / `SMS` / `PUSH` / `IN_APP`

### `notification_status`
`PENDING` / `SENT` / `DELIVERED` / `READ` / `FAILED`

### `recipient_type`
`CUSTOMER` / `ADMIN` / `ARTIST` / `STAFF`

### `outbox_status`
| 값 | 설명 |
|----|------|
| `pending` | 처리 대기 |
| `sending` | 처리 중 (동시 실행 방지 Lock) |
| `sent` | 발송 완료 |
| `failed` | 재시도 횟수 초과 → 영구 실패 |
| `dead_letter` | 수동 확인 필요 |

---

## 고객 관련

### `customer_type`
`local` (내국인) / `foreign` (외국인)

### `gender_type`
`male` / `female` / `other` / `unknown`

### `customer_tag`
| 값 | 설명 |
|----|------|
| `VIP` | VIP 고객 |
| `REGULAR` | 단골 |
| `NEW` | 신규 |
| `RETURNING` | 재방문 |
| `DORMANT` | 휴면 (장기 미방문) |
| `CHURNED` | 이탈 |
| `POTENTIAL_VIP` | VIP 후보 |

### `customer_grade`
`BRONZE` / `SILVER` / `GOLD` / `PLATINUM` / `DIAMOND`

### `group_type`
`MANUAL` / `AUTO` / `HYBRID`

---

## 정액권 관련

### `membership_type`
| 값 | 설명 |
|----|------|
| `COUNT_BASED` | 횟수제 (예: 컷 10회권) |
| `TIME_BASED` | 기간제 (예: 1개월 무제한) |
| `AMOUNT_BASED` | 금액권 (예: 10만원 충전) |
| `BUNDLE` | 패키지 (예: 컷+펌+염색 세트) |

### `membership_status`
`ACTIVE` / `EXPIRED` / `EXHAUSTED` / `SUSPENDED` / `CANCELLED` / `REFUNDED`

### `activation_type`
`IMMEDIATE` (구매 즉시 시작) / `FIRST_USE` (첫 사용 시 시작)

---

## 리뷰 관련

### `report_status`
`PENDING` / `REVIEWING` / `RESOLVED` / `DISMISSED`
