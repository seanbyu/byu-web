-- ============================================
-- 04_triggers.sql
-- 모든 트리거 함수 + 트리거 등록 (최종 버전)
-- ============================================

-- ============================================
-- updated_at 트리거 — 모든 테이블
-- ============================================

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at             BEFORE UPDATE ON users             FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS update_salons_updated_at ON salons;
CREATE TRIGGER update_salons_updated_at            BEFORE UPDATE ON salons            FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS update_staff_positions_updated_at ON staff_positions;
CREATE TRIGGER update_staff_positions_updated_at   BEFORE UPDATE ON staff_positions   FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS update_staff_profiles_updated_at ON staff_profiles;
CREATE TRIGGER update_staff_profiles_updated_at    BEFORE UPDATE ON staff_profiles    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at         BEFORE UPDATE ON customers         FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS update_service_categories_updated_at ON service_categories;
CREATE TRIGGER update_service_categories_updated_at BEFORE UPDATE ON service_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS update_services_updated_at ON services;
CREATE TRIGGER update_services_updated_at          BEFORE UPDATE ON services          FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS update_service_position_prices_updated_at ON service_position_prices;
CREATE TRIGGER update_service_position_prices_updated_at BEFORE UPDATE ON service_position_prices FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at          BEFORE UPDATE ON bookings          FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS update_reviews_updated_at ON reviews;
CREATE TRIGGER update_reviews_updated_at           BEFORE UPDATE ON reviews           FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS update_notifications_updated_at ON notifications;
CREATE TRIGGER update_notifications_updated_at     BEFORE UPDATE ON notifications     FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS update_notification_outbox_updated_at ON notification_outbox;
CREATE TRIGGER update_notification_outbox_updated_at BEFORE UPDATE ON notification_outbox FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS update_salon_line_settings_updated_at ON salon_line_settings;
CREATE TRIGGER update_salon_line_settings_updated_at BEFORE UPDATE ON salon_line_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at          BEFORE UPDATE ON payments          FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS update_salon_promptpay_settings_updated_at ON salon_promptpay_settings;
CREATE TRIGGER update_salon_promptpay_settings_updated_at BEFORE UPDATE ON salon_promptpay_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS update_membership_plans_updated_at ON membership_plans;
CREATE TRIGGER update_membership_plans_updated_at  BEFORE UPDATE ON membership_plans  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS update_customer_memberships_updated_at ON customer_memberships;
CREATE TRIGGER update_customer_memberships_updated_at BEFORE UPDATE ON customer_memberships FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS update_customer_cycles_updated_at ON customer_cycles;
CREATE TRIGGER update_customer_cycles_updated_at   BEFORE UPDATE ON customer_cycles   FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS update_message_jobs_updated_at ON message_jobs;
CREATE TRIGGER update_message_jobs_updated_at      BEFORE UPDATE ON message_jobs      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS update_user_identities_updated_at ON user_identities;
CREATE TRIGGER update_user_identities_updated_at   BEFORE UPDATE ON user_identities   FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 고객 통계 트리거 (no_show, total_spent, last_visit)
-- ============================================

CREATE OR REPLACE FUNCTION update_customer_no_show_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'NO_SHOW' AND (OLD.status IS NULL OR OLD.status != 'NO_SHOW') THEN
    UPDATE customers SET no_show_count = no_show_count + 1 WHERE id = NEW.customer_id;
  END IF;
  IF OLD.status = 'NO_SHOW' AND NEW.status != 'NO_SHOW' THEN
    UPDATE customers SET no_show_count = GREATEST(0, no_show_count - 1) WHERE id = NEW.customer_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_no_show_count ON bookings;
CREATE TRIGGER trg_update_no_show_count
AFTER UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_customer_no_show_count();

CREATE OR REPLACE FUNCTION update_customer_total_spent()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.payment_status = 'PAID' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'PAID') THEN
    UPDATE customers SET total_spent = total_spent + NEW.total_price WHERE id = NEW.customer_id;
  END IF;
  IF NEW.payment_status = 'REFUNDED' AND OLD.payment_status = 'PAID' THEN
    UPDATE customers SET total_spent = GREATEST(0, total_spent - OLD.total_price) WHERE id = NEW.customer_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_total_spent ON bookings;
CREATE TRIGGER trg_update_total_spent
AFTER UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_customer_total_spent();

CREATE OR REPLACE FUNCTION update_customer_total_spent_on_insert()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.payment_status = 'PAID' THEN
    UPDATE customers SET total_spent = total_spent + NEW.total_price WHERE id = NEW.customer_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_total_spent_insert ON bookings;
CREATE TRIGGER trg_update_total_spent_insert
AFTER INSERT ON bookings FOR EACH ROW EXECUTE FUNCTION update_customer_total_spent_on_insert();

CREATE OR REPLACE FUNCTION update_customer_last_visit()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'COMPLETED' AND (OLD.status IS NULL OR OLD.status != 'COMPLETED') THEN
    UPDATE customers SET
      last_visit    = NEW.booking_date,
      total_visits  = total_visits + 1,
      updated_at    = NOW()
    WHERE id = NEW.customer_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_last_visit ON bookings;
CREATE TRIGGER trg_update_last_visit
AFTER UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_customer_last_visit();

-- ============================================
-- auth.users 생성 시 자동 프로필 생성
-- ============================================

CREATE OR REPLACE FUNCTION handle_new_auth_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
DECLARE
  v_salon_id UUID;
  v_permissions JSONB;
  v_is_approved BOOLEAN;
  v_is_owner BOOLEAN;
  v_work_schedule JSONB;
  v_business_hours JSONB;
BEGIN
  IF (NEW.raw_user_meta_data->>'salon_id' IS NOT NULL) THEN
    v_salon_id := (NEW.raw_user_meta_data->>'salon_id')::UUID;
  END IF;

  v_is_approved := COALESCE((NEW.raw_user_meta_data->>'is_approved')::boolean, true);
  v_is_owner    := COALESCE((NEW.raw_user_meta_data->>'is_owner')::boolean, false);

  INSERT INTO users (id, user_type, role, email, name, phone, profile_image)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'CUSTOMER')::user_type,
    COALESCE(NEW.raw_user_meta_data->>'role',
      CASE
        WHEN COALESCE(NEW.raw_user_meta_data->>'user_type', 'CUSTOMER') = 'SALON' THEN 'ADMIN'
        ELSE 'CUSTOMER'
      END
    )::user_role,
    -- placeholder 이메일(@line.local 등)은 NULL로 저장
    CASE
      WHEN NEW.email IS NULL OR NEW.email LIKE '%@line.local' OR NEW.email LIKE '%@auth.local' THEN NULL
      ELSE NEW.email
    END,
    -- full_name(LINE 등 OAuth), name, 이메일 순서로 fallback
    COALESCE(
      NEW.raw_user_meta_data->>'name',
      NEW.raw_user_meta_data->>'full_name',
      NULLIF(SPLIT_PART(COALESCE(NEW.email, ''), '@', 1), ''),
      'User'
    ),
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;

  IF (COALESCE(NEW.raw_user_meta_data->>'user_type', 'CUSTOMER') = 'SALON') THEN
    v_permissions := COALESCE((NEW.raw_user_meta_data->>'permissions')::jsonb, NULL);

    IF v_salon_id IS NOT NULL THEN
      SELECT business_hours INTO v_business_hours FROM salons WHERE id = v_salon_id;
      IF v_business_hours IS NOT NULL THEN
        v_work_schedule := jsonb_build_object(
          'monday',    jsonb_build_object('enabled', COALESCE((v_business_hours->'monday'->>'enabled')::boolean, false),    'start', v_business_hours->'monday'->>'open',    'end', v_business_hours->'monday'->>'close'),
          'tuesday',   jsonb_build_object('enabled', COALESCE((v_business_hours->'tuesday'->>'enabled')::boolean, true),   'start', v_business_hours->'tuesday'->>'open',   'end', v_business_hours->'tuesday'->>'close'),
          'wednesday', jsonb_build_object('enabled', COALESCE((v_business_hours->'wednesday'->>'enabled')::boolean, true), 'start', v_business_hours->'wednesday'->>'open', 'end', v_business_hours->'wednesday'->>'close'),
          'thursday',  jsonb_build_object('enabled', COALESCE((v_business_hours->'thursday'->>'enabled')::boolean, true),  'start', v_business_hours->'thursday'->>'open',  'end', v_business_hours->'thursday'->>'close'),
          'friday',    jsonb_build_object('enabled', COALESCE((v_business_hours->'friday'->>'enabled')::boolean, true),    'start', v_business_hours->'friday'->>'open',    'end', v_business_hours->'friday'->>'close'),
          'saturday',  jsonb_build_object('enabled', COALESCE((v_business_hours->'saturday'->>'enabled')::boolean, true),  'start', v_business_hours->'saturday'->>'open',  'end', v_business_hours->'saturday'->>'close'),
          'sunday',    jsonb_build_object('enabled', COALESCE((v_business_hours->'sunday'->>'enabled')::boolean, true),    'start', v_business_hours->'sunday'->>'open',    'end', v_business_hours->'sunday'->>'close')
        );
      END IF;
    END IF;

    INSERT INTO staff_profiles (user_id, salon_id, is_owner, is_approved, approved_by, approved_at, permissions, work_schedule)
    VALUES (
      NEW.id, v_salon_id, v_is_owner, v_is_approved,
      CASE WHEN v_is_approved = true THEN NEW.id ELSE NULL END,
      CASE WHEN v_is_approved = true THEN NOW() ELSE NULL END,
      COALESCE(v_permissions, '{}'::jsonb),
      v_work_schedule
    );
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN RETURN NEW;
  WHEN OTHERS THEN
    RAISE LOG 'Error in handle_new_auth_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_auth_user();

-- ============================================
-- 새 살롱 생성 시 기본 고객 필터 시드
-- ============================================

CREATE OR REPLACE FUNCTION trigger_seed_customer_filters()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM seed_default_customer_filters(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS after_salon_insert_seed_customer_filters ON salons;
CREATE TRIGGER after_salon_insert_seed_customer_filters
AFTER INSERT ON salons FOR EACH ROW EXECUTE FUNCTION trigger_seed_customer_filters();

-- ============================================
-- 고객 통계 필터 updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_customer_filters_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS customer_filters_updated_at ON customer_filters;
CREATE TRIGGER customer_filters_updated_at
BEFORE UPDATE ON customer_filters FOR EACH ROW EXECUTE FUNCTION update_customer_filters_updated_at();

-- ============================================
-- 전화번호 정규화 트리거
-- ============================================

CREATE OR REPLACE FUNCTION fn_normalize_customer_phone()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.phone IS NOT NULL AND NEW.phone != '' THEN
    NEW.phone_normalized := regexp_replace(NEW.phone, '[^0-9+]', '', 'g');
  ELSE
    NEW.phone_normalized := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_normalize_customer_phone ON customers;
CREATE TRIGGER trg_normalize_customer_phone
BEFORE INSERT OR UPDATE OF phone ON customers
FOR EACH ROW EXECUTE FUNCTION fn_normalize_customer_phone();

-- ============================================
-- 예약금 노쇼 자동 몰수
-- ============================================

CREATE OR REPLACE FUNCTION forfeit_deposit_on_no_show()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'NO_SHOW' AND OLD.status != 'NO_SHOW'
     AND NEW.deposit_status = 'PAID' THEN
    NEW.deposit_status    := 'FORFEITED';
    NEW.deposit_forfeited_at := NOW();
    NEW.deposit_notes     := COALESCE(NEW.deposit_notes, '') ||
                             E'\n[자동] 노쇼로 인한 예약금 몰수 - ' || NOW()::TEXT;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_forfeit_deposit_on_no_show ON bookings;
CREATE TRIGGER trg_forfeit_deposit_on_no_show
BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION forfeit_deposit_on_no_show();

-- ============================================
-- 예약 완료 시 customer_cycles 자동 갱신
-- ============================================

CREATE OR REPLACE FUNCTION handle_booking_completed()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_cycle_days INTEGER;
  v_completed_at TIMESTAMP WITH TIME ZONE;
BEGIN
  IF NEW.status = 'COMPLETED' AND (OLD.status IS NULL OR OLD.status != 'COMPLETED') THEN
    v_completed_at := COALESCE(NEW.completed_at, NOW());
    IF NEW.completed_at IS NULL THEN NEW.completed_at := v_completed_at; END IF;

    SELECT COALESCE(cc.cycle_days, s.default_cycle_days, 30)
    INTO v_cycle_days
    FROM services s
    LEFT JOIN customer_cycles cc
      ON cc.salon_id = NEW.salon_id AND cc.customer_id = NEW.customer_id AND cc.service_id = NEW.service_id
    WHERE s.id = NEW.service_id;

    IF v_cycle_days IS NULL THEN v_cycle_days := 30; END IF;

    INSERT INTO customer_cycles (
      salon_id, customer_id, service_id,
      cycle_days, last_completed_at, next_due_at
    ) VALUES (
      NEW.salon_id, NEW.customer_id, NEW.service_id,
      v_cycle_days, v_completed_at, v_completed_at + (v_cycle_days || ' days')::INTERVAL
    )
    ON CONFLICT (salon_id, customer_id, service_id) DO UPDATE SET
      last_completed_at = EXCLUDED.last_completed_at,
      next_due_at       = EXCLUDED.next_due_at,
      cycle_days = CASE
        WHEN customer_cycles.cycle_days != 30
          AND customer_cycles.cycle_days != COALESCE((SELECT default_cycle_days FROM services WHERE id = NEW.service_id), 30)
        THEN customer_cycles.cycle_days
        ELSE EXCLUDED.cycle_days
      END,
      updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_booking_completed ON bookings;
CREATE TRIGGER trg_booking_completed
BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION handle_booking_completed();

-- ============================================
-- User Identity primary 유일성 보장
-- ============================================

CREATE OR REPLACE FUNCTION ensure_single_primary_identity()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.is_primary = true THEN
    UPDATE user_identities SET is_primary = false
    WHERE user_id = NEW.user_id AND id != NEW.id AND is_primary = true;
    UPDATE users SET primary_identity_id = NEW.id WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ensure_single_primary_identity ON user_identities;
CREATE TRIGGER trg_ensure_single_primary_identity
AFTER INSERT OR UPDATE OF is_primary ON user_identities
FOR EACH ROW WHEN (NEW.is_primary = true)
EXECUTE FUNCTION ensure_single_primary_identity();

-- ============================================
-- 예약 알림 트리거 3종
-- ============================================

-- 1. 예약 생성 → 어드민 IN_APP 알림
CREATE OR REPLACE FUNCTION trg_on_booking_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_d     RECORD;
  v_owner RECORD;
BEGIN
  SELECT * INTO v_d FROM get_booking_notification_data(NEW.id);
  IF NOT FOUND THEN RETURN NEW; END IF;

  FOR v_owner IN
    SELECT sp.user_id FROM staff_profiles sp WHERE sp.salon_id = NEW.salon_id AND sp.is_owner = true
  LOOP
    INSERT INTO notifications (
      salon_id, booking_id, recipient_type, recipient_user_id,
      notification_type, channel, title, body, metadata, status
    ) VALUES (
      NEW.salon_id, NEW.id, 'ADMIN', v_owner.user_id,
      'BOOKING_REQUEST', 'IN_APP',
      '새 예약 요청',
      v_d.formatted_date || ' ' || COALESCE(v_d.artist_name, '') || ' | ' || COALESCE(v_d.customer_name, '고객') || '님',
      jsonb_build_object(
        'artist_name', v_d.artist_name, 'customer_name', v_d.customer_name,
        'service_name', v_d.service_name, 'booking_date', v_d.booking_date, 'start_time', v_d.start_time
      ),
      'PENDING'
    );
  END LOOP;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG '[trg_on_booking_insert] error for booking %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_booking_inserted ON bookings;
CREATE TRIGGER trg_booking_inserted
AFTER INSERT ON bookings FOR EACH ROW EXECUTE FUNCTION trg_on_booking_insert();

-- 2. 예약 일정 변경 → 어드민 IN_APP 알림
CREATE OR REPLACE FUNCTION trg_on_booking_rescheduled()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_d RECORD;
  v_owner RECORD;
BEGIN
  IF COALESCE((OLD.booking_meta->>'reschedule_pending')::boolean, false)
     OR NOT COALESCE((NEW.booking_meta->>'reschedule_pending')::boolean, false) THEN
    RETURN NEW;
  END IF;

  SELECT * INTO v_d FROM get_booking_notification_data(NEW.id);
  IF NOT FOUND THEN RETURN NEW; END IF;

  FOR v_owner IN
    SELECT sp.user_id FROM staff_profiles sp WHERE sp.salon_id = NEW.salon_id AND sp.is_owner = true
  LOOP
    INSERT INTO notifications (
      salon_id, booking_id, recipient_type, recipient_user_id,
      notification_type, channel, title, body, metadata, status
    ) VALUES (
      NEW.salon_id, NEW.id, 'ADMIN', v_owner.user_id,
      'BOOKING_MODIFIED', 'IN_APP',
      '예약 일정 변경 요청',
      COALESCE(v_d.customer_name, '고객') || '님 → ' || v_d.formatted_date,
      jsonb_build_object(
        'artist_name', v_d.artist_name, 'customer_name', v_d.customer_name,
        'service_name', v_d.service_name, 'booking_date', v_d.booking_date, 'start_time', v_d.start_time
      ),
      'PENDING'
    );
  END LOOP;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG '[trg_on_booking_rescheduled] error for booking %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_booking_rescheduled ON bookings;
CREATE TRIGGER trg_booking_rescheduled
AFTER UPDATE ON bookings FOR EACH ROW
WHEN (OLD.booking_meta IS DISTINCT FROM NEW.booking_meta)
EXECUTE FUNCTION trg_on_booking_rescheduled();

-- 3. 예약 상태 변경 → 고객 LINE + IN_APP + 취소 시 어드민 IN_APP (36번 최신)
CREATE OR REPLACE FUNCTION trg_on_booking_status_changed()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_t0              TIMESTAMPTZ := clock_timestamp();
  v_t1              TIMESTAMPTZ;
  v_d               RECORD;
  v_owner           RECORD;
  v_locale          TEXT;
  v_notif_type      notification_type;
  v_idempotency_key TEXT;
  v_notif_id        UUID;
  v_cancelled_by    TEXT;
BEGIN
  IF OLD.status = NEW.status THEN RETURN NEW; END IF;
  IF NEW.status NOT IN ('CONFIRMED', 'CANCELLED') THEN RETURN NEW; END IF;

  SELECT * INTO v_d FROM get_booking_notification_data(NEW.id);
  v_t1 := clock_timestamp();
  RAISE LOG '[perf][trg_status_changed] fetch=%.1fms booking=%',
    EXTRACT(EPOCH FROM (v_t1 - v_t0)) * 1000, NEW.id;
  IF NOT FOUND THEN RETURN NEW; END IF;

  v_locale       := COALESCE(NEW.booking_meta->>'locale', 'ko');
  v_cancelled_by := COALESCE(NEW.booking_meta->>'cancelled_by', 'CUSTOMER');

  IF NEW.status = 'CONFIRMED' THEN
    IF COALESCE((NEW.booking_meta->>'reschedule_pending')::boolean, false) THEN
      v_notif_type := 'BOOKING_MODIFIED';
    ELSE
      v_notif_type := 'BOOKING_CONFIRMED';
    END IF;
  ELSE
    v_notif_type := 'BOOKING_CANCELLED';
  END IF;

  -- LINE 발송: notifications + outbox 원자적 생성
  IF v_d.line_user_id IS NOT NULL AND NOT v_d.opt_out AND NOT v_d.line_blocked THEN
    INSERT INTO notifications (
      salon_id, booking_id, recipient_type, recipient_customer_id,
      notification_type, channel, title, body, metadata, status
    ) VALUES (
      NEW.salon_id, NEW.id, 'CUSTOMER', v_d.customer_id,
      v_notif_type, 'LINE',
      v_notif_type::TEXT, v_notif_type::TEXT,
      jsonb_build_object(
        'artist_name', v_d.artist_name, 'customer_name', v_d.customer_name,
        'service_name', v_d.service_name, 'booking_date', v_d.booking_date, 'start_time', v_d.start_time
      ),
      'PENDING'
    )
    RETURNING id INTO v_notif_id;

    v_idempotency_key :=
      NEW.id::TEXT || ':' || v_notif_type::TEXT || ':' || TO_CHAR(NOW(), 'YYYY-MM-DD');

    INSERT INTO notification_outbox (
      notification_id, salon_id, booking_id,
      channel, notification_type,
      recipient_line_user_id, recipient_customer_id,
      payload, idempotency_key, status, next_retry_at
    ) VALUES (
      v_notif_id, NEW.salon_id, NEW.id,
      'LINE', v_notif_type,
      v_d.line_user_id, v_d.customer_id,
      jsonb_build_object(
        'locale',         v_locale,
        'salon_name',     v_d.salon_name,
        'customer_name',  v_d.customer_name,
        'artist_name',    v_d.artist_name,
        'service_name',   v_d.service_name,
        'formatted_date', v_d.formatted_date,
        'booking_date',   v_d.booking_date,
        'start_time',     v_d.start_time
      ),
      v_idempotency_key, 'pending', NOW()
    )
    ON CONFLICT (idempotency_key) DO NOTHING;
  END IF;

  -- 고객 IN_APP 알림 (LINE 연동 여부 무관)
  IF v_d.customer_id IS NOT NULL THEN
    INSERT INTO notifications (
      salon_id, booking_id, recipient_type, recipient_customer_id,
      notification_type, channel, title, body, metadata, status
    ) VALUES (
      NEW.salon_id, NEW.id, 'CUSTOMER', v_d.customer_id,
      v_notif_type, 'IN_APP',
      v_notif_type::TEXT, v_notif_type::TEXT,
      jsonb_build_object(
        'artist_name', v_d.artist_name, 'customer_name', v_d.customer_name,
        'service_name', v_d.service_name, 'booking_date', v_d.booking_date,
        'start_time', v_d.start_time, 'salon_name', v_d.salon_name
      ),
      'SENT'
    );
  END IF;

  -- 취소 시 어드민 IN_APP (어드민 직접 취소는 제외)
  IF NEW.status = 'CANCELLED' AND v_cancelled_by != 'ADMIN' THEN
    FOR v_owner IN
      SELECT sp.user_id FROM staff_profiles sp WHERE sp.salon_id = NEW.salon_id AND sp.is_owner = true
    LOOP
      INSERT INTO notifications (
        salon_id, booking_id, recipient_type, recipient_user_id,
        notification_type, channel, title, body, metadata, status
      ) VALUES (
        NEW.salon_id, NEW.id, 'ADMIN', v_owner.user_id,
        'BOOKING_CANCELLED', 'IN_APP',
        'BOOKING_CANCELLED', 'BOOKING_CANCELLED',
        jsonb_build_object(
          'artist_name', v_d.artist_name, 'customer_name', v_d.customer_name,
          'service_name', v_d.service_name, 'booking_date', v_d.booking_date,
          'start_time', v_d.start_time, 'cancelled_by', v_cancelled_by
        ),
        'PENDING'
      );
    END LOOP;
  END IF;

  RAISE LOG '[perf][trg_status_changed] total=%.1fms status=% booking=%',
    EXTRACT(EPOCH FROM (clock_timestamp() - v_t0)) * 1000, NEW.status, NEW.id;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG '[trg_status_changed] ERROR booking=% err=%', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_booking_status_changed ON bookings;
CREATE TRIGGER trg_booking_status_changed
AFTER UPDATE ON bookings FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION trg_on_booking_status_changed();
