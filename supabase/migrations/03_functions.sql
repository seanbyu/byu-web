-- ============================================
-- 03_functions.sql
-- 모든 헬퍼·RPC 함수 (최종 버전)
-- 트리거 함수는 04_triggers.sql에 위치
-- ============================================

-- ============================================
-- updated_at 트리거 함수 (트리거에서 공통 사용)
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- RLS 헬퍼 함수
-- ============================================

CREATE OR REPLACE FUNCTION get_my_role()
RETURNS user_role AS $$
  SELECT role FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_my_salon_id()
RETURNS UUID AS $$
  SELECT salon_id FROM staff_profiles WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================
-- 고객 매칭 함수 (LINE 로그인 연동)
-- ============================================

CREATE OR REPLACE FUNCTION find_customer_by_phone(
  p_salon_id UUID,
  p_phone TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_customer_id UUID;
BEGIN
  p_phone := regexp_replace(p_phone, '[^0-9+]', '', 'g');

  SELECT id INTO v_customer_id
  FROM customers
  WHERE salon_id = p_salon_id
    AND regexp_replace(phone, '[^0-9+]', '', 'g') = p_phone
  LIMIT 1;

  RETURN v_customer_id;
END;
$$;

COMMENT ON FUNCTION find_customer_by_phone IS 'Find customer by normalized phone number';

CREATE OR REPLACE FUNCTION link_line_user_to_customer(
  p_user_id UUID,
  p_salon_id UUID,
  p_phone TEXT,
  p_name TEXT DEFAULT NULL,
  p_acquisition_meta JSONB DEFAULT '{}'
)
RETURNS TABLE (
  customer_id UUID,
  is_new_customer BOOLEAN,
  customer_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_customer_id UUID;
  v_is_new BOOLEAN := false;
  v_customer_name TEXT;
BEGIN
  v_customer_id := find_customer_by_phone(p_salon_id, p_phone);

  IF v_customer_id IS NOT NULL THEN
    UPDATE customers
    SET
      user_id = p_user_id,
      acquisition_meta = COALESCE(acquisition_meta, '{}'::jsonb) || p_acquisition_meta,
      updated_at = NOW()
    WHERE id = v_customer_id
    RETURNING name INTO v_customer_name;

    UPDATE users SET customer_id = v_customer_id WHERE id = p_user_id;
  ELSE
    INSERT INTO customers (salon_id, user_id, name, phone, acquisition_meta)
    VALUES (
      p_salon_id, p_user_id,
      COALESCE(p_name, 'LINE User'),
      p_phone,
      p_acquisition_meta || '{"registered_via": "line_login"}'::jsonb
    )
    RETURNING id, name INTO v_customer_id, v_customer_name;

    v_is_new := true;
    UPDATE users SET customer_id = v_customer_id WHERE id = p_user_id;
  END IF;

  RETURN QUERY SELECT v_customer_id, v_is_new, v_customer_name;
END;
$$;

COMMENT ON FUNCTION link_line_user_to_customer IS 'Link LINE user to existing customer by phone, or create new customer';

-- ============================================
-- 고객번호 함수 (gap-filling 방식 — 44번 최신)
-- ============================================

CREATE OR REPLACE FUNCTION get_next_customer_number(p_salon_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  candidate INTEGER := 1;
BEGIN
  LOOP
    EXIT WHEN NOT EXISTS (
      SELECT 1
      FROM customers
      WHERE salon_id = p_salon_id
        AND customer_number = candidate::TEXT
    );
    candidate := candidate + 1;
  END LOOP;

  RETURN candidate::TEXT;
END;
$$;

COMMENT ON FUNCTION get_next_customer_number IS '살롱의 다음 고객번호를 반환 (빈 번호 gap-filling 방식)';

-- ============================================
-- 고객 필터 시드 함수
-- ============================================

CREATE OR REPLACE FUNCTION seed_default_customer_filters(p_salon_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO customer_filters (salon_id, filter_key, is_system_filter, label, label_en, label_th, conditions, display_order)
  VALUES
    (p_salon_id, 'all',       true, '전체',   'All',       'ทั้งหมด', '[]'::jsonb, 0),
    (p_salon_id, 'new',       true, '신규',   'New',       'ใหม่',
     '[{"field": "total_visits", "operator": "==", "value": 0}]'::jsonb, 1),
    (p_salon_id, 'returning', true, '재방문', 'Returning', 'กลับมา',
     '[{"field": "total_visits", "operator": ">", "value": 0}, {"field": "total_visits", "operator": "<", "value": 5}]'::jsonb, 2),
    (p_salon_id, 'regular',   true, '단골',   'Regular',   'ประจำ',
     '[{"field": "total_visits", "operator": ">=", "value": 5}]'::jsonb, 3),
    (p_salon_id, 'dormant',   true, '휴면',   'Dormant',   'พักตัว',
     '[{"field": "days_since_last_visit", "operator": ">", "value": 30}]'::jsonb, 4),
    (p_salon_id, 'vip',       true, 'VIP',    'VIP',       'VIP',
     '[{"field": "total_spent", "operator": ">=", "value": 100000}]'::jsonb, 5)
  ON CONFLICT (salon_id, filter_key) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 예약 가용성 RPC
-- ============================================

CREATE OR REPLACE FUNCTION get_salon_availability(
  p_salon_id UUID,
  p_booking_date DATE
)
RETURNS TABLE (
  artist_id UUID,
  start_time TIME,
  end_time TIME,
  duration_minutes INTEGER,
  status TEXT
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT b.artist_id, b.start_time, b.end_time, b.duration_minutes, b.status::TEXT
  FROM bookings b
  WHERE b.salon_id = p_salon_id
    AND b.booking_date = p_booking_date
    AND b.status NOT IN ('CANCELLED', 'NO_SHOW');
$$;

CREATE OR REPLACE FUNCTION get_designer_availability(
  p_artist_id UUID,
  p_booking_date DATE
)
RETURNS TABLE (
  artist_id UUID,
  start_time TIME,
  end_time TIME,
  duration_minutes INTEGER,
  status TEXT
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT b.artist_id, b.start_time, b.end_time, b.duration_minutes, b.status::TEXT
  FROM bookings b
  WHERE b.artist_id = p_artist_id
    AND b.booking_date = p_booking_date
    AND b.status NOT IN ('CANCELLED', 'NO_SHOW');
$$;

-- ============================================
-- 알림 헬퍼: 예약 정보 조회 + 포맷
-- ============================================

CREATE OR REPLACE FUNCTION get_booking_notification_data(p_booking_id UUID)
RETURNS TABLE (
  salon_id        UUID,
  customer_id     UUID,
  artist_id       UUID,
  service_id      UUID,
  booking_date    DATE,
  start_time      TEXT,
  customer_name   TEXT,
  artist_name     TEXT,
  salon_name      TEXT,
  service_name    TEXT,
  line_user_id    TEXT,
  opt_out         BOOLEAN,
  line_blocked    BOOLEAN,
  formatted_date  TEXT
)
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT
    b.salon_id,
    b.customer_id,
    b.artist_id,
    b.service_id,
    b.booking_date,
    LEFT(b.start_time::TEXT, 5)                AS start_time,
    c.name                                      AS customer_name,
    u.name                                      AS artist_name,
    s.name                                      AS salon_name,
    COALESCE(sc.name, sv.name)                  AS service_name,
    c.line_user_id,
    COALESCE(c.opt_out, false)                  AS opt_out,
    COALESCE(c.line_blocked, false)             AS line_blocked,
    TO_CHAR(b.booking_date, 'MM월 DD일')
      || ' (' || TRIM(TO_CHAR(b.booking_date, 'Dy')) || ') '
      || LEFT(b.start_time::TEXT, 5)            AS formatted_date
  FROM  bookings b
  JOIN  customers c  ON c.id = b.customer_id
  JOIN  users u      ON u.id = b.artist_id
  JOIN  salons s     ON s.id = b.salon_id
  LEFT JOIN services sv           ON sv.id = b.service_id
  LEFT JOIN service_categories sc ON sc.id = sv.category_id
  WHERE b.id = p_booking_id;
$$;

-- ============================================
-- claim_outbox_batch — PL/pgSQL + 타이밍 로그 (33번 최신)
-- ============================================

CREATE OR REPLACE FUNCTION claim_outbox_batch(p_limit INT DEFAULT 20)
RETURNS SETOF notification_outbox
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_t0    TIMESTAMPTZ := clock_timestamp();
  v_count INT;
BEGIN
  RETURN QUERY
    UPDATE notification_outbox
    SET
      status     = 'sending',
      updated_at = NOW()
    WHERE id IN (
      SELECT id
      FROM   notification_outbox
      WHERE  status        = 'pending'
        AND  next_retry_at <= NOW()
      ORDER  BY next_retry_at ASC
      LIMIT  p_limit
      FOR UPDATE SKIP LOCKED
    )
    RETURNING *;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  RAISE LOG '[perf][claim_outbox_batch] claimed=% duration=%.1fms',
    v_count,
    EXTRACT(EPOCH FROM (clock_timestamp() - v_t0)) * 1000;
END;
$$;

-- service_role 전용 (32번/33번 hardening 반영)
REVOKE ALL ON FUNCTION claim_outbox_batch(INT) FROM PUBLIC;
REVOKE ALL ON FUNCTION claim_outbox_batch(INT) FROM anon;
REVOKE ALL ON FUNCTION claim_outbox_batch(INT) FROM authenticated;
GRANT EXECUTE ON FUNCTION claim_outbox_batch(INT) TO service_role;

COMMENT ON FUNCTION claim_outbox_batch IS
  'pending 레코드를 sending으로 원자적 전환. FOR UPDATE SKIP LOCKED로 동시 처리 방지.';

-- ============================================
-- LINE 자동화 RPC (재예약·휴면 복귀·리마인더 대상 조회)
-- ============================================

CREATE OR REPLACE FUNCTION get_rebook_due_targets()
RETURNS TABLE (
  salon_id UUID, customer_id UUID, service_id UUID,
  customer_name TEXT, service_name TEXT, salon_name TEXT,
  line_user_id TEXT, locale TEXT
)
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT DISTINCT ON (cc.customer_id, cc.service_id)
    cc.salon_id, cc.customer_id, cc.service_id,
    c.name, COALESCE(s.name_en, s.name), sal.name,
    c.line_user_id,
    COALESCE(sal.settings->>'locale', 'en')
  FROM customer_cycles cc
  JOIN customers c  ON c.id  = cc.customer_id
  JOIN services s   ON s.id  = cc.service_id
  JOIN salons sal   ON sal.id = cc.salon_id
  WHERE cc.next_due_at IS NOT NULL
    AND NOW() >= cc.next_due_at - INTERVAL '3 days'
    AND NOW() <  cc.next_due_at + INTERVAL '1 day'
    AND c.opt_out = false
    AND c.line_user_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM message_jobs mj
      WHERE mj.customer_id = cc.customer_id
        AND mj.job_type = 'rebook_due' AND mj.status = 'sent'
        AND mj.sent_at >= NOW() - INTERVAL '14 days'
    )
    AND NOT EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.customer_id = cc.customer_id
        AND b.status IN ('PENDING','CONFIRMED') AND b.booking_date >= CURRENT_DATE
    )
    AND sal.is_active = true;
$$;

CREATE OR REPLACE FUNCTION get_rebook_overdue_targets()
RETURNS TABLE (
  salon_id UUID, customer_id UUID, service_id UUID,
  customer_name TEXT, service_name TEXT, salon_name TEXT,
  line_user_id TEXT, locale TEXT
)
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT DISTINCT ON (cc.customer_id, cc.service_id)
    cc.salon_id, cc.customer_id, cc.service_id,
    c.name, COALESCE(s.name_en, s.name), sal.name,
    c.line_user_id,
    COALESCE(sal.settings->>'locale', 'en')
  FROM customer_cycles cc
  JOIN customers c  ON c.id  = cc.customer_id
  JOIN services s   ON s.id  = cc.service_id
  JOIN salons sal   ON sal.id = cc.salon_id
  WHERE cc.next_due_at IS NOT NULL
    AND NOW() >= cc.next_due_at + INTERVAL '7 days'
    AND NOW() <  cc.next_due_at + INTERVAL '21 days'
    AND c.opt_out = false AND c.line_user_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM message_jobs mj
      WHERE mj.customer_id = cc.customer_id
        AND mj.job_type = 'rebook_overdue' AND mj.status = 'sent'
        AND mj.sent_at >= NOW() - INTERVAL '14 days'
    )
    AND NOT EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.customer_id = cc.customer_id
        AND b.status IN ('PENDING','CONFIRMED') AND b.booking_date >= CURRENT_DATE
    )
    AND sal.is_active = true;
$$;

CREATE OR REPLACE FUNCTION get_reminder_24h_targets()
RETURNS TABLE (
  salon_id UUID, customer_id UUID, booking_id UUID, service_id UUID,
  customer_name TEXT, service_name TEXT, salon_name TEXT,
  line_user_id TEXT, booking_date TEXT, booking_time TEXT,
  artist_name TEXT, locale TEXT
)
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT
    b.salon_id, b.customer_id, b.id,
    b.service_id, c.name, COALESCE(s.name_en, s.name), sal.name,
    c.line_user_id,
    TO_CHAR(b.booking_date, 'YYYY-MM-DD'),
    TO_CHAR(b.start_time, 'HH24:MI'),
    COALESCE(u.name, ''),
    COALESCE(sal.settings->>'locale', 'en')
  FROM bookings b
  JOIN customers c ON c.id = b.customer_id
  JOIN services s  ON s.id = b.service_id
  JOIN salons sal   ON sal.id = b.salon_id
  LEFT JOIN users u ON u.id = b.artist_id
  WHERE b.status IN ('PENDING','CONFIRMED')
    AND (b.booking_date + b.start_time) >= NOW() + INTERVAL '23 hours 45 minutes'
    AND (b.booking_date + b.start_time) <  NOW() + INTERVAL '24 hours 15 minutes'
    AND c.opt_out = false AND c.line_user_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM message_jobs mj
      WHERE mj.booking_id = b.id AND mj.job_type = 'reminder_24h'
        AND mj.status IN ('sent','pending')
    )
    AND sal.is_active = true;
$$;

CREATE OR REPLACE FUNCTION get_reminder_3h_targets()
RETURNS TABLE (
  salon_id UUID, customer_id UUID, booking_id UUID, service_id UUID,
  customer_name TEXT, service_name TEXT, salon_name TEXT,
  line_user_id TEXT, booking_date TEXT, booking_time TEXT,
  artist_name TEXT, locale TEXT
)
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT
    b.salon_id, b.customer_id, b.id,
    b.service_id, c.name, COALESCE(s.name_en, s.name), sal.name,
    c.line_user_id,
    TO_CHAR(b.booking_date, 'YYYY-MM-DD'),
    TO_CHAR(b.start_time, 'HH24:MI'),
    COALESCE(u.name, ''),
    COALESCE(sal.settings->>'locale', 'en')
  FROM bookings b
  JOIN customers c ON c.id = b.customer_id
  JOIN services s  ON s.id = b.service_id
  JOIN salons sal   ON sal.id = b.salon_id
  LEFT JOIN users u ON u.id = b.artist_id
  WHERE b.status IN ('PENDING','CONFIRMED')
    AND (b.booking_date + b.start_time) >= NOW() + INTERVAL '2 hours 45 minutes'
    AND (b.booking_date + b.start_time) <  NOW() + INTERVAL '3 hours 15 minutes'
    AND c.opt_out = false AND c.line_user_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM message_jobs mj
      WHERE mj.booking_id = b.id AND mj.job_type = 'reminder_3h'
        AND mj.status IN ('sent','pending')
    )
    AND sal.is_active = true;
$$;

-- ============================================
-- 예약 당일 리마인더 큐잉 함수
-- ============================================

CREATE OR REPLACE FUNCTION queue_booking_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_booking  RECORD;
  v_d        RECORD;
  v_title    TEXT;
  v_body     TEXT;
  v_line_msg JSONB;
  v_ikey     TEXT;
  v_notif_id UUID;
BEGIN
  FOR v_booking IN
    SELECT b.id, b.salon_id
    FROM   bookings b
    WHERE  b.booking_date = CURRENT_DATE
      AND  b.status       = 'CONFIRMED'
      AND NOT EXISTS (
        SELECT 1
        FROM   notification_outbox o
        WHERE  o.booking_id        = b.id
          AND  o.notification_type = 'BOOKING_REMINDER'
          AND  o.status           IN ('pending','sending','sent')
      )
  LOOP
    SELECT * INTO v_d FROM get_booking_notification_data(v_booking.id);

    IF NOT FOUND OR v_d.line_user_id IS NULL OR v_d.opt_out OR v_d.line_blocked THEN
      CONTINUE;
    END IF;

    v_title := COALESCE(v_d.salon_name, '') || ' 예약 당일 안내';
    v_body  := v_d.customer_name
               || '님, 오늘 ' || v_d.start_time || ' '
               || COALESCE(v_d.artist_name, '') || '님과의 '
               || COALESCE(v_d.service_name, '') || ' 예약이 있습니다. 방문 기다리겠습니다!';

    v_line_msg := jsonb_build_object('type','text','text', v_title || E'\n\n' || v_body);
    v_ikey := v_booking.id::TEXT || ':BOOKING_REMINDER:' || TO_CHAR(NOW(), 'YYYY-MM-DD');

    INSERT INTO notifications (
      salon_id, booking_id, recipient_type, recipient_customer_id,
      notification_type, channel, title, body, metadata, status
    ) VALUES (
      v_booking.salon_id, v_booking.id, 'CUSTOMER', v_d.customer_id,
      'BOOKING_REMINDER', 'LINE', v_title, v_body,
      jsonb_build_object(
        'salon_name',     v_d.salon_name,
        'artist_name',    v_d.artist_name,
        'customer_name',  v_d.customer_name,
        'service_name',   v_d.service_name,
        'booking_date',   v_d.booking_date,
        'start_time',     v_d.start_time,
        'formatted_date', v_d.formatted_date
      ),
      'PENDING'
    )
    RETURNING id INTO v_notif_id;

    INSERT INTO notification_outbox (
      notification_id, salon_id, booking_id,
      channel, notification_type,
      recipient_line_user_id, recipient_customer_id,
      payload, idempotency_key, status, next_retry_at
    ) VALUES (
      v_notif_id, v_booking.salon_id, v_booking.id,
      'LINE', 'BOOKING_REMINDER',
      v_d.line_user_id, v_d.customer_id,
      jsonb_build_object(
        'title',         v_title,   'body',          v_body,
        'line_message',  v_line_msg,
        'salon_name',    v_d.salon_name,
        'artist_name',   v_d.artist_name,
        'customer_name', v_d.customer_name,
        'service_name',  v_d.service_name,
        'booking_date',  v_d.booking_date,
        'start_time',    v_d.start_time,
        'formatted_date',v_d.formatted_date
      ),
      v_ikey, 'pending', NOW()
    )
    ON CONFLICT (idempotency_key) DO NOTHING;

  END LOOP;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG '[queue_booking_reminders] error: %', SQLERRM;
END;
$$;

COMMENT ON FUNCTION queue_booking_reminders IS
  '오늘 날짜 CONFIRMED 예약 중 LINE 리마인더가 없는 건을 notification_outbox에 큐잉. pg_cron이 매일 09:00 ICT(02:00 UTC) 호출.';

-- ============================================
-- 정액권 관련 함수
-- ============================================

CREATE OR REPLACE FUNCTION check_deposit_exempt_by_membership(
  p_customer_id UUID,
  p_salon_id UUID,
  p_service_id UUID DEFAULT NULL
)
RETURNS TABLE (
  is_exempt BOOLEAN,
  membership_id UUID,
  membership_name TEXT,
  remaining_count INTEGER,
  remaining_amount DECIMAL
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    CASE WHEN cm.id IS NOT NULL AND mp.deposit_exempt = true THEN true ELSE false END,
    cm.id, mp.name, cm.remaining_count, cm.remaining_amount
  FROM customer_memberships cm
  JOIN membership_plans mp ON mp.id = cm.plan_id
  WHERE cm.customer_id = p_customer_id
    AND cm.salon_id = p_salon_id
    AND cm.status = 'ACTIVE'
    AND (cm.expires_at IS NULL OR cm.expires_at > NOW())
    AND (
      (cm.remaining_count IS NOT NULL AND cm.remaining_count > 0)
      OR (cm.remaining_amount IS NOT NULL AND cm.remaining_amount > 0)
      OR (mp.membership_type = 'TIME_BASED')
    )
    AND (
      p_service_id IS NULL
      OR mp.all_services = true
      OR p_service_id = ANY(mp.applicable_service_ids)
    )
  ORDER BY cm.expires_at ASC NULLS LAST
  LIMIT 1;
END;
$$;

CREATE OR REPLACE FUNCTION use_membership(
  p_membership_id UUID,
  p_booking_id UUID,
  p_service_id UUID,
  p_count_to_use INTEGER DEFAULT 1,
  p_amount_to_use DECIMAL DEFAULT NULL,
  p_processed_by UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_membership RECORD;
  v_usage_id UUID;
  v_new_remaining_count INTEGER;
  v_new_remaining_amount DECIMAL;
BEGIN
  SELECT * INTO v_membership FROM customer_memberships WHERE id = p_membership_id FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Membership not found: %', p_membership_id; END IF;
  IF v_membership.status != 'ACTIVE' THEN RAISE EXCEPTION 'Membership is not active: %', v_membership.status; END IF;

  IF v_membership.expires_at IS NOT NULL AND v_membership.expires_at < NOW() THEN
    UPDATE customer_memberships SET status = 'EXPIRED', updated_at = NOW() WHERE id = p_membership_id;
    RAISE EXCEPTION 'Membership has expired';
  END IF;

  IF v_membership.starts_at IS NULL AND v_membership.activation_type = 'FIRST_USE' THEN
    UPDATE customer_memberships SET
      starts_at = NOW(),
      expires_at = CASE
        WHEN (SELECT validity_days FROM membership_plans WHERE id = v_membership.plan_id) IS NOT NULL
        THEN NOW() + ((SELECT validity_days FROM membership_plans WHERE id = v_membership.plan_id) || ' days')::INTERVAL
        ELSE expires_at
      END,
      updated_at = NOW()
    WHERE id = p_membership_id
    RETURNING * INTO v_membership;
  END IF;

  IF p_count_to_use IS NOT NULL AND p_count_to_use > 0 THEN
    IF v_membership.remaining_count IS NULL OR v_membership.remaining_count < p_count_to_use THEN
      RAISE EXCEPTION 'Insufficient remaining count: % < %', v_membership.remaining_count, p_count_to_use;
    END IF;
    v_new_remaining_count := v_membership.remaining_count - p_count_to_use;
  ELSE
    v_new_remaining_count := v_membership.remaining_count;
  END IF;

  IF p_amount_to_use IS NOT NULL AND p_amount_to_use > 0 THEN
    IF v_membership.remaining_amount IS NULL OR v_membership.remaining_amount < p_amount_to_use THEN
      RAISE EXCEPTION 'Insufficient remaining amount: % < %', v_membership.remaining_amount, p_amount_to_use;
    END IF;
    v_new_remaining_amount := v_membership.remaining_amount - p_amount_to_use;
  ELSE
    v_new_remaining_amount := v_membership.remaining_amount;
  END IF;

  INSERT INTO membership_usages (
    membership_id, booking_id, service_id,
    count_used, amount_used,
    remaining_count_after, remaining_amount_after,
    processed_by
  ) VALUES (
    p_membership_id, p_booking_id, p_service_id,
    p_count_to_use, p_amount_to_use,
    v_new_remaining_count, v_new_remaining_amount,
    p_processed_by
  )
  RETURNING id INTO v_usage_id;

  UPDATE customer_memberships SET
    remaining_count  = v_new_remaining_count,
    remaining_amount = v_new_remaining_amount,
    used_count  = used_count  + COALESCE(p_count_to_use,  0),
    used_amount = used_amount + COALESCE(p_amount_to_use, 0),
    status = CASE
      WHEN v_new_remaining_count = 0 AND v_new_remaining_amount IS NULL THEN 'EXHAUSTED'
      WHEN v_new_remaining_count IS NULL AND v_new_remaining_amount = 0 THEN 'EXHAUSTED'
      WHEN v_new_remaining_count = 0 AND v_new_remaining_amount = 0    THEN 'EXHAUSTED'
      ELSE status
    END,
    updated_at = NOW()
  WHERE id = p_membership_id;

  IF p_booking_id IS NOT NULL THEN
    UPDATE bookings SET
      membership_id = p_membership_id,
      membership_usage_id = v_usage_id,
      deposit_exempt_by_membership = true,
      updated_at = NOW()
    WHERE id = p_booking_id;
  END IF;

  RETURN v_usage_id;
END;
$$;

CREATE OR REPLACE FUNCTION cancel_membership_usage(
  p_usage_id UUID,
  p_reason TEXT DEFAULT NULL,
  p_cancelled_by UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_usage RECORD;
BEGIN
  SELECT * INTO v_usage FROM membership_usages WHERE id = p_usage_id AND is_cancelled = false FOR UPDATE;
  IF NOT FOUND THEN RETURN false; END IF;

  UPDATE membership_usages SET
    is_cancelled = true, cancelled_at = NOW(),
    cancel_reason = p_reason, cancelled_by = p_cancelled_by
  WHERE id = p_usage_id;

  UPDATE customer_memberships SET
    remaining_count  = remaining_count  + COALESCE(v_usage.count_used,  0),
    remaining_amount = remaining_amount + COALESCE(v_usage.amount_used, 0),
    used_count  = used_count  - COALESCE(v_usage.count_used,  0),
    used_amount = used_amount - COALESCE(v_usage.amount_used, 0),
    status = CASE WHEN status = 'EXHAUSTED' THEN 'ACTIVE' ELSE status END,
    updated_at = NOW()
  WHERE id = v_usage.membership_id;

  IF v_usage.booking_id IS NOT NULL THEN
    UPDATE bookings SET
      membership_id = NULL, membership_usage_id = NULL,
      deposit_exempt_by_membership = false, updated_at = NOW()
    WHERE id = v_usage.booking_id;
  END IF;

  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION expire_memberships()
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE v_count INTEGER;
BEGIN
  UPDATE customer_memberships SET status = 'EXPIRED', updated_at = NOW()
  WHERE status = 'ACTIVE' AND expires_at IS NOT NULL AND expires_at < NOW();
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- ============================================
-- User Identity 함수
-- ============================================

CREATE OR REPLACE FUNCTION find_or_create_user_by_identity(
  p_auth_id UUID,
  p_provider auth_provider,
  p_provider_user_id TEXT,
  p_profile JSONB,
  p_email TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_name TEXT DEFAULT NULL
)
RETURNS TABLE (user_id UUID, is_new_user BOOLEAN, is_new_identity BOOLEAN)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_is_new_user BOOLEAN := false;
  v_is_new_identity BOOLEAN := false;
BEGIN
  SELECT ui.user_id INTO v_user_id FROM user_identities ui WHERE ui.auth_id = p_auth_id;

  IF v_user_id IS NOT NULL THEN
    UPDATE user_identities SET last_used_at = NOW(), profile = COALESCE(p_profile, profile) WHERE auth_id = p_auth_id;
    RETURN QUERY SELECT v_user_id, false, false;
    RETURN;
  END IF;

  IF p_email IS NOT NULL AND p_email NOT LIKE '%@line.local' THEN
    SELECT id INTO v_user_id FROM users WHERE email = p_email AND deleted_at IS NULL;
    IF v_user_id IS NOT NULL THEN
      INSERT INTO user_identities (user_id, auth_id, provider, provider_user_id, profile)
      VALUES (v_user_id, p_auth_id, p_provider, p_provider_user_id, p_profile);
      RETURN QUERY SELECT v_user_id, false, true;
      RETURN;
    END IF;
  END IF;

  IF p_phone IS NOT NULL THEN
    SELECT id INTO v_user_id FROM users WHERE phone = p_phone AND deleted_at IS NULL;
    IF v_user_id IS NOT NULL THEN
      INSERT INTO user_identities (user_id, auth_id, provider, provider_user_id, profile)
      VALUES (v_user_id, p_auth_id, p_provider, p_provider_user_id, p_profile);
      RETURN QUERY SELECT v_user_id, false, true;
      RETURN;
    END IF;
  END IF;

  -- users.id = auth.users.id (FK 제약) — gen_random_uuid() 금지
  -- 트리거가 이미 행을 만들었을 수 있으므로 ON CONFLICT DO NOTHING
  INSERT INTO users (id, user_type, role, email, name, phone)
  VALUES (
    p_auth_id, 'CUSTOMER', 'CUSTOMER',
    p_email,  -- NULL 허용 (LINE 이메일 없는 경우)
    COALESCE(p_name, p_profile->>'displayName', p_profile->>'name', 'User'),
    p_phone
  )
  ON CONFLICT (id) DO NOTHING;

  v_user_id := p_auth_id;
  v_is_new_user := true;

  INSERT INTO user_identities (user_id, auth_id, provider, provider_user_id, profile, is_primary)
  VALUES (v_user_id, p_auth_id, p_provider, p_provider_user_id, p_profile, true)
  ON CONFLICT DO NOTHING;

  RETURN QUERY SELECT v_user_id, true, true;
END;
$$;

CREATE OR REPLACE FUNCTION link_identity(
  p_user_id UUID,
  p_auth_id UUID,
  p_provider auth_provider,
  p_provider_user_id TEXT,
  p_profile JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_identity_id UUID;
  v_existing_user_id UUID;
BEGIN
  SELECT user_id INTO v_existing_user_id FROM user_identities WHERE auth_id = p_auth_id;
  IF v_existing_user_id IS NOT NULL THEN
    IF v_existing_user_id = p_user_id THEN
      SELECT id INTO v_identity_id FROM user_identities WHERE auth_id = p_auth_id;
      RETURN v_identity_id;
    ELSE
      RAISE EXCEPTION 'This social account is already linked to another user';
    END IF;
  END IF;

  SELECT id INTO v_identity_id FROM user_identities WHERE user_id = p_user_id AND provider = p_provider;
  IF v_identity_id IS NOT NULL THEN
    RAISE EXCEPTION 'User already has a % account linked', p_provider;
  END IF;

  INSERT INTO user_identities (user_id, auth_id, provider, provider_user_id, profile)
  VALUES (p_user_id, p_auth_id, p_provider, p_provider_user_id, p_profile)
  RETURNING id INTO v_identity_id;

  RETURN v_identity_id;
END;
$$;

CREATE OR REPLACE FUNCTION unlink_identity(
  p_user_id UUID,
  p_provider auth_provider
)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_identity_count INT;
  v_is_primary BOOLEAN;
BEGIN
  SELECT COUNT(*) INTO v_identity_count FROM user_identities WHERE user_id = p_user_id;
  IF v_identity_count <= 1 THEN
    RAISE EXCEPTION 'Cannot unlink the last identity. User must have at least one login method.';
  END IF;

  SELECT is_primary INTO v_is_primary FROM user_identities WHERE user_id = p_user_id AND provider = p_provider;
  IF v_is_primary THEN
    UPDATE user_identities SET is_primary = true
    WHERE id = (SELECT id FROM user_identities WHERE user_id = p_user_id AND provider != p_provider LIMIT 1);
  END IF;

  DELETE FROM user_identities WHERE user_id = p_user_id AND provider = p_provider;
  RETURN true;
END;
$$;

-- ============================================
-- 알림 정리 함수
-- ============================================

CREATE OR REPLACE FUNCTION delete_old_notifications()
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM notifications WHERE created_at < NOW() - INTERVAL '1 day';
END;
$$;

-- ============================================
-- 메시지 발송 지표 뷰
-- ============================================

CREATE OR REPLACE VIEW v_message_job_stats AS
SELECT
  mj.salon_id,
  mj.job_type,
  DATE_TRUNC('day', mj.created_at) AS day,
  COUNT(*) FILTER (WHERE mj.status = 'sent')    AS sent_count,
  COUNT(*) FILTER (WHERE mj.status = 'failed')  AS failed_count,
  COUNT(*) FILTER (WHERE mj.status = 'skipped') AS skipped_count,
  COUNT(*) FILTER (WHERE mj.status = 'pending') AS pending_count,
  COUNT(DISTINCT me.id) FILTER (WHERE me.event_type = 'clicked')   AS click_count,
  COUNT(DISTINCT me.id) FILTER (WHERE me.event_type = 'converted') AS conversion_count
FROM message_jobs mj
LEFT JOIN message_events me ON me.message_job_id = mj.id
GROUP BY mj.salon_id, mj.job_type, DATE_TRUNC('day', mj.created_at);
