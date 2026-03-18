-- ============================================
-- 01_extensions_enums.sql
-- Extensions & ENUM Types (Final State)
-- ============================================

-- ============================================
-- Extensions
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================
-- ENUM Types
-- ============================================

-- User type discriminator
DO $$ BEGIN
  CREATE TYPE user_type AS ENUM (
    'SALON',      -- 살롱 측 사용자 (B2B: ADMIN, MANAGER, ARTIST, STAFF)
    'CUSTOMER'    -- 고객 (B2C: LINE 예약 고객)
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- User roles (System-level permissions)
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM (
    'SUPER_ADMIN',    -- Platform owner (manages all salons)
    'ADMIN',          -- Salon owner (default on signup)
    'MANAGER',        -- Salon manager
    'ARTIST',         -- Artist/Designer (시술 담당)
    'STAFF',          -- General staff
    'CUSTOMER'        -- Customer
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Auth provider types
DO $$ BEGIN
  CREATE TYPE auth_provider AS ENUM (
    'EMAIL',          -- Email/password
    'LINE',           -- LINE login
    'GOOGLE',         -- Google OAuth
    'KAKAO'           -- Kakao login
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Salon approval status
DO $$ BEGIN
  CREATE TYPE approval_status_type AS ENUM (
    'pending',        -- 승인 대기
    'approved',       -- 승인됨
    'rejected'        -- 거절됨
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Booking status
DO $$ BEGIN
  CREATE TYPE booking_status AS ENUM (
    'PENDING',        -- 예약 대기
    'CONFIRMED',      -- 예약 확정
    'IN_PROGRESS',    -- 시술 중
    'COMPLETED',      -- 완료
    'CANCELLED',      -- 취소
    'NO_SHOW'         -- 노쇼
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Payment status
DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM (
    'PENDING',
    'PAID',
    'REFUNDED',
    'FAILED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Customer type
DO $$ BEGIN
  CREATE TYPE customer_type AS ENUM (
    'local',          -- 내국인
    'foreign'         -- 외국인
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Notification type (BOOKING_REMINDER 포함)
DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM (
    'BOOKING_REQUEST',      -- 예약 요청 (어드민에게)
    'BOOKING_CONFIRMED',    -- 예약 확정 (고객에게)
    'BOOKING_CANCELLED',    -- 예약 취소 (양쪽에게)
    'BOOKING_REMINDER',     -- 예약 리마인더 (고객에게)
    'BOOKING_COMPLETED',    -- 시술 완료 (리뷰 요청)
    'BOOKING_NO_SHOW',      -- 노쇼 알림 (어드민에게)
    'BOOKING_MODIFIED',     -- 예약 변경 (양쪽에게)
    'REVIEW_RECEIVED',      -- 리뷰 등록됨 (어드민에게)
    'GENERAL'               -- 일반 알림
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Notification channel
DO $$ BEGIN
  CREATE TYPE notification_channel AS ENUM (
    'LINE',
    'EMAIL',
    'SMS',
    'PUSH',
    'IN_APP'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Notification status
DO $$ BEGIN
  CREATE TYPE notification_status AS ENUM (
    'PENDING',    -- 발송 대기
    'SENT',       -- 발송 완료
    'DELIVERED',  -- 전달 확인
    'READ',       -- 읽음
    'FAILED'      -- 발송 실패
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Recipient type
DO $$ BEGIN
  CREATE TYPE recipient_type AS ENUM (
    'CUSTOMER',   -- 고객
    'ADMIN',      -- 살롱 관리자
    'ARTIST',     -- 담당 아티스트
    'STAFF'       -- 스태프
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Outbox status (notification_outbox 전용)
DO $$ BEGIN
  CREATE TYPE outbox_status AS ENUM (
    'pending',      -- 처리 대기
    'sending',      -- 처리 중 (동시 실행 방지 Lock)
    'sent',         -- 발송 완료
    'failed',       -- 재시도 횟수 초과 → 영구 실패
    'dead_letter'   -- 수동 확인 필요 (관리자 검토)
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Deposit status
DO $$ BEGIN
  CREATE TYPE deposit_status AS ENUM (
    'NOT_REQUIRED',       -- 예약금 불필요
    'PENDING',            -- 결제 대기
    'PAID',               -- 결제 완료
    'PARTIALLY_REFUNDED', -- 부분 환불
    'REFUNDED',           -- 전액 환불
    'FORFEITED'           -- 몰수 (노쇼/취소)
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Payment method
DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM (
    'CASH',               -- 현금
    'CREDIT_CARD',        -- 신용카드
    'DEBIT_CARD',         -- 체크카드
    'BANK_TRANSFER',      -- 계좌이체
    'PROMPTPAY',          -- 프롬프트페이 (태국)
    'LINE_PAY',           -- 라인페이
    'TRUE_MONEY',         -- 트루머니 (태국)
    'RABBIT_LINE_PAY',    -- 래빗 라인페이 (태국)
    'SHOPEE_PAY',         -- 쇼피페이
    'OTHER'               -- 기타
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Payment transaction status
DO $$ BEGIN
  CREATE TYPE payment_transaction_status AS ENUM (
    'PENDING',            -- 대기
    'PROCESSING',         -- 처리 중
    'COMPLETED',          -- 완료
    'FAILED',             -- 실패
    'CANCELLED',          -- 취소
    'REFUNDED'            -- 환불됨
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Payment type
DO $$ BEGIN
  CREATE TYPE payment_type AS ENUM (
    'DEPOSIT',            -- 예약금
    'FULL_PAYMENT',       -- 전액 결제
    'PARTIAL_PAYMENT',    -- 부분 결제
    'REFUND',             -- 환불
    'ADDITIONAL'          -- 추가 결제
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Membership type
DO $$ BEGIN
  CREATE TYPE membership_type AS ENUM (
    'COUNT_BASED',    -- 횟수제 (예: 컷 10회권)
    'TIME_BASED',     -- 기간제 (예: 1개월 무제한)
    'AMOUNT_BASED',   -- 금액권 (예: 10만원 충전)
    'BUNDLE'          -- 패키지 (예: 컷+펌+염색 세트)
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Membership status
DO $$ BEGIN
  CREATE TYPE membership_status AS ENUM (
    'ACTIVE',         -- 사용 가능
    'EXPIRED',        -- 만료됨
    'EXHAUSTED',      -- 소진됨 (횟수/금액 모두 사용)
    'SUSPENDED',      -- 일시정지
    'CANCELLED',      -- 취소됨
    'REFUNDED'        -- 환불됨
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Activation type
DO $$ BEGIN
  CREATE TYPE activation_type AS ENUM (
    'IMMEDIATE',      -- 구매 즉시 시작
    'FIRST_USE'       -- 첫 사용 시 시작
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Gender type
DO $$ BEGIN
  CREATE TYPE gender_type AS ENUM ('male', 'female', 'other', 'unknown');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Customer tag
DO $$ BEGIN
  CREATE TYPE customer_tag AS ENUM (
    'VIP',           -- VIP 고객
    'REGULAR',       -- 단골
    'NEW',           -- 신규
    'RETURNING',     -- 재방문
    'DORMANT',       -- 휴면 (장기 미방문)
    'CHURNED',       -- 이탈
    'POTENTIAL_VIP'  -- VIP 후보
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Customer grade
DO $$ BEGIN
  CREATE TYPE customer_grade AS ENUM (
    'BRONZE',    -- 기본
    'SILVER',    -- 실버
    'GOLD',      -- 골드
    'PLATINUM',  -- 플래티넘
    'DIAMOND'    -- 다이아몬드
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Group type
DO $$ BEGIN
  CREATE TYPE group_type AS ENUM (
    'MANUAL',     -- 수동 할당만
    'AUTO',       -- 자동 할당만
    'HYBRID'      -- 자동 + 수동
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Report status
DO $$ BEGIN
  CREATE TYPE report_status AS ENUM (
    'PENDING',     -- 신고 접수
    'REVIEWING',   -- 검토 중
    'RESOLVED',    -- 처리 완료
    'DISMISSED'    -- 기각
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
