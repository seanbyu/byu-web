-- ============================================
-- patch_auth_fix.sql
-- LINE 유저 public.users 생성 버그 수정 패치
--
-- 수정 파일 목록:
--   02_tables.sql     : users.email NOT NULL 제거 (LINE 유저는 이메일 없음)
--   03_functions.sql  : find_or_create_user_by_identity — gen_random_uuid() → p_auth_id (FK 위반 수정)
--   04_triggers.sql   : handle_new_auth_user — placeholder 이메일 NULL 저장, full_name fallback 추가
--   05_rls.sql        : users 테이블 CUSTOMER 자신의 행 INSERT 허용 정책 추가
-- ============================================


-- ============================================
-- 02_tables.sql: users.email nullable
-- LINE 등 이메일 없는 OAuth 유저 지원
-- ============================================
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;


-- ============================================
-- 03_functions.sql: find_or_create_user_by_identity
-- 기존 버그: gen_random_uuid()로 users.id 생성
--   → users.id는 auth.users(id) FK 참조라 반드시 auth UUID와 일치해야 함
--   → FK 위반으로 INSERT 실패, public.users 행 미생성
-- 수정: p_auth_id 사용 + ON CONFLICT DO NOTHING (트리거와 중복 방지)
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
  -- 이미 identity가 있으면 last_used_at만 갱신
  SELECT ui.user_id INTO v_user_id FROM user_identities ui WHERE ui.auth_id = p_auth_id;

  IF v_user_id IS NOT NULL THEN
    UPDATE user_identities SET last_used_at = NOW(), profile = COALESCE(p_profile, profile) WHERE auth_id = p_auth_id;
    RETURN QUERY SELECT v_user_id, false, false;
    RETURN;
  END IF;

  -- 실제 이메일로 기존 유저 매칭
  IF p_email IS NOT NULL AND p_email NOT LIKE '%@line.local' THEN
    SELECT id INTO v_user_id FROM users WHERE email = p_email AND deleted_at IS NULL;
    IF v_user_id IS NOT NULL THEN
      INSERT INTO user_identities (user_id, auth_id, provider, provider_user_id, profile)
      VALUES (v_user_id, p_auth_id, p_provider, p_provider_user_id, p_profile);
      RETURN QUERY SELECT v_user_id, false, true;
      RETURN;
    END IF;
  END IF;

  -- 전화번호로 기존 유저 매칭
  IF p_phone IS NOT NULL THEN
    SELECT id INTO v_user_id FROM users WHERE phone = p_phone AND deleted_at IS NULL;
    IF v_user_id IS NOT NULL THEN
      INSERT INTO user_identities (user_id, auth_id, provider, provider_user_id, profile)
      VALUES (v_user_id, p_auth_id, p_provider, p_provider_user_id, p_profile);
      RETURN QUERY SELECT v_user_id, false, true;
      RETURN;
    END IF;
  END IF;

  -- 신규 유저 생성
  -- users.id = p_auth_id (auth.users FK 충족)
  -- 트리거가 이미 생성했을 수 있으므로 ON CONFLICT DO NOTHING
  INSERT INTO users (id, user_type, role, email, name, phone)
  VALUES (
    p_auth_id, 'CUSTOMER', 'CUSTOMER',
    p_email,
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


-- ============================================
-- 04_triggers.sql: handle_new_auth_user
-- 기존 버그:
--   1. @line.local placeholder 이메일을 users.email에 그대로 저장
--   2. LINE 유저 이름을 raw_user_meta_data->>'name'만 확인 (full_name 누락)
-- 수정:
--   1. placeholder 이메일(@line.local, @auth.local) → NULL 저장
--   2. full_name fallback 추가
--   3. ON CONFLICT (id) DO NOTHING — RPC와 중복 실행 시 안전
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
    -- placeholder 이메일은 NULL로 저장
    CASE
      WHEN NEW.email IS NULL OR NEW.email LIKE '%@line.local' OR NEW.email LIKE '%@auth.local' THEN NULL
      ELSE NEW.email
    END,
    -- name → full_name(LINE OAuth) → 이메일 앞부분 순으로 fallback
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


-- ============================================
-- 05_rls.sql: users 테이블 CUSTOMER INSERT 정책
-- CUSTOMER 유저가 자신의 행을 직접 생성할 수 있도록 허용
-- (트리거/RPC 실패 시 API 폴백용)
-- ============================================
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
CREATE POLICY "Users can insert their own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id AND user_type = 'CUSTOMER' AND role = 'CUSTOMER');
