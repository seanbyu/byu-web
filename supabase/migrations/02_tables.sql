-- ============================================
-- 02_tables.sql
-- All Tables (Final State, dependency order)
-- ============================================

-- ============================================
-- Industries
-- ============================================
CREATE TABLE IF NOT EXISTS industries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE industries IS 'Business types (HAIR, NAIL, ESTHETIC, etc.)';

-- ============================================
-- Salons
-- ============================================
CREATE TABLE IF NOT EXISTS salons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic info
  name TEXT NOT NULL,
  description TEXT,

  -- Contact
  phone TEXT NOT NULL,
  email TEXT,

  -- Address
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT,
  postal_code TEXT,
  country TEXT NOT NULL DEFAULT 'TH',
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),

  -- Business hours (JSONB for flexibility)
  business_hours JSONB DEFAULT '{
    "monday": {"enabled": false, "open": null, "close": null},
    "tuesday": {"enabled": true, "open": "10:00", "close": "21:00"},
    "wednesday": {"enabled": true, "open": "10:00", "close": "21:00"},
    "thursday": {"enabled": true, "open": "10:00", "close": "21:00"},
    "friday": {"enabled": true, "open": "10:00", "close": "21:00"},
    "saturday": {"enabled": true, "open": "10:00", "close": "21:00"},
    "sunday": {"enabled": true, "open": "10:00", "close": "21:00"}
  }'::jsonb,

  -- Holidays (휴무일)
  holidays JSONB DEFAULT '[]'::jsonb,

  -- Media
  logo_url TEXT,
  cover_image_url TEXT,

  -- Settings
  settings JSONB DEFAULT '{
    "booking_advance_days": 30,
    "booking_cancellation_hours": 24,
    "slot_duration_minutes": 30,
    "currency": "THB",
    "timezone": "Asia/Bangkok"
  }'::jsonb,

  -- Subscription plan
  plan_type TEXT NOT NULL DEFAULT 'FREE',

  -- Approval status
  approval_status approval_status_type NOT NULL DEFAULT 'pending',
  rejected_reason TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  trial_ends_at TIMESTAMP WITH TIME ZONE,

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  deleted_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_salons_active ON salons(is_active) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_salons_location ON salons(latitude, longitude) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_salons_approval ON salons(approval_status);

COMMENT ON TABLE salons IS 'Beauty salon information';

-- ============================================
-- Salon Industries (Many-to-Many)
-- ============================================
CREATE TABLE IF NOT EXISTS salon_industries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
  industry_id UUID REFERENCES industries(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  UNIQUE (salon_id, industry_id)
);

CREATE INDEX IF NOT EXISTS idx_salon_industries_salon ON salon_industries(salon_id);
CREATE INDEX IF NOT EXISTS idx_salon_industries_industry ON salon_industries(industry_id);

-- ============================================
-- Salon Images (Gallery)
-- ============================================
CREATE TABLE IF NOT EXISTS salon_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_salon_images_salon ON salon_images(salon_id);

-- ============================================
-- Users (final state: auth_provider, provider_user_id, line_profile 제거됨)
-- primary_identity_id, customer_id 포함
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Discriminator
  user_type user_type NOT NULL,
  role user_role NOT NULL DEFAULT 'ADMIN',

  -- Basic info
  email TEXT UNIQUE,  -- NULL 허용: LINE 등 이메일 없는 OAuth 유저
  name TEXT NOT NULL,
  phone TEXT,
  profile_image TEXT,

  -- Customer link (for LINE users linked to salon customer)
  customer_id UUID,  -- FK added after customers table

  -- Primary identity (set after user_identities table)
  primary_identity_id UUID,  -- FK added after user_identities table

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  deleted_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_user_type_role CHECK (
    (user_type = 'SALON' AND role IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'ARTIST', 'STAFF')) OR
    (user_type = 'CUSTOMER' AND role = 'CUSTOMER')
  )
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone) WHERE phone IS NOT NULL;

COMMENT ON TABLE users IS 'Unified users table for both admin users and LINE customers';
COMMENT ON COLUMN users.customer_id IS 'Link to customers table (for LINE login users)';
COMMENT ON COLUMN users.primary_identity_id IS '주 로그인 수단 (프로필 사진 등에 사용)';

-- ============================================
-- User Identities (다중 소셜 로그인)
-- ============================================
CREATE TABLE IF NOT EXISTS user_identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  auth_id UUID NOT NULL UNIQUE,  -- auth.users.id 참조

  -- 소셜 로그인 정보
  provider auth_provider NOT NULL,
  provider_user_id TEXT,

  -- 소셜 프로필 정보
  profile JSONB DEFAULT '{}'::jsonb,

  -- 연동 상태
  is_primary BOOLEAN NOT NULL DEFAULT false,
  connected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_user_provider UNIQUE (user_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_user_identities_user ON user_identities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_identities_auth ON user_identities(auth_id);
CREATE INDEX IF NOT EXISTS idx_user_identities_provider ON user_identities(provider);
CREATE INDEX IF NOT EXISTS idx_user_identities_provider_user ON user_identities(provider, provider_user_id);

COMMENT ON TABLE user_identities IS '유저별 소셜 로그인 연동 정보 (다중 소셜 지원)';

-- users.primary_identity_id FK 추가 (user_identities 생성 후)
ALTER TABLE users
  ADD CONSTRAINT fk_users_primary_identity
  FOREIGN KEY (primary_identity_id) REFERENCES user_identities(id)
  ON DELETE SET NULL
  DEFERRABLE INITIALLY DEFERRED;

-- ============================================
-- Staff Positions
-- ============================================
CREATE TABLE IF NOT EXISTS staff_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  name_en TEXT,
  name_th TEXT,
  description TEXT,

  level INTEGER NOT NULL DEFAULT 1,
  display_order INTEGER NOT NULL DEFAULT 0,

  is_active BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  UNIQUE(salon_id, name)
);

CREATE INDEX IF NOT EXISTS idx_staff_positions_salon ON staff_positions(salon_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_staff_positions_level ON staff_positions(salon_id, level);

COMMENT ON TABLE staff_positions IS 'Customizable staff positions per salon (디렉터, 스페셜 디렉터, etc.)';
COMMENT ON COLUMN staff_positions.level IS 'Hierarchy level for pricing (1=lowest, higher=more expensive)';

-- ============================================
-- Staff Profiles (display_order 포함 - 18번 migration 반영)
-- ============================================
CREATE TABLE IF NOT EXISTS staff_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,

  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,

  is_owner BOOLEAN NOT NULL DEFAULT false,

  is_approved BOOLEAN NOT NULL DEFAULT true,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,

  created_by UUID REFERENCES users(id) ON DELETE SET NULL,

  position_id UUID REFERENCES staff_positions(id) ON DELETE SET NULL,

  is_booking_enabled BOOLEAN NOT NULL DEFAULT true,

  permissions JSONB NOT NULL DEFAULT '{
    "bookings": {"view": true, "create": true, "edit": true, "delete": false},
    "customers": {"view": true, "create": true, "edit": true, "delete": false},
    "services": {"view": true, "create": false, "edit": false, "delete": false},
    "staff": {"view": true, "create": false, "edit": false, "delete": false},
    "settings": {"view": false, "edit": false}
  }'::jsonb,

  work_schedule JSONB DEFAULT '{
    "monday": {"enabled": false, "start": null, "end": null},
    "tuesday": {"enabled": true, "start": "10:00", "end": "21:00"},
    "wednesday": {"enabled": true, "start": "10:00", "end": "21:00"},
    "thursday": {"enabled": true, "start": "10:00", "end": "21:00"},
    "friday": {"enabled": true, "start": "10:00", "end": "21:00"},
    "saturday": {"enabled": true, "start": "10:00", "end": "21:00"},
    "sunday": {"enabled": true, "start": "10:00", "end": "21:00"}
  }'::jsonb,

  holidays JSONB DEFAULT '[]'::jsonb,

  bio TEXT,
  specialties TEXT[],
  years_of_experience INTEGER,
  social_links JSONB DEFAULT '{}'::jsonb,

  -- 18번: 예약 UI 표시 순서
  display_order INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staff_profiles_salon ON staff_profiles(salon_id);
CREATE INDEX IF NOT EXISTS idx_staff_profiles_position ON staff_profiles(position_id);
CREATE INDEX IF NOT EXISTS idx_staff_profiles_created_by ON staff_profiles(created_by);
CREATE INDEX IF NOT EXISTS idx_staff_profiles_display_order ON staff_profiles(salon_id, display_order);
CREATE INDEX IF NOT EXISTS idx_staff_profiles_salon_owner ON staff_profiles(salon_id, is_owner) WHERE is_owner = true;

-- Ensure only one owner per salon
CREATE UNIQUE INDEX IF NOT EXISTS idx_staff_profiles_salon_owner_unique ON staff_profiles(salon_id) WHERE is_owner = true;

COMMENT ON TABLE staff_profiles IS 'Additional profile data for staff users';
COMMENT ON COLUMN staff_profiles.is_booking_enabled IS 'Determines if the staff member can receive bookings';
COMMENT ON COLUMN staff_profiles.display_order IS 'Display order in booking UI (lower = higher priority)';

-- ============================================
-- Customers (final state: all extended fields)
-- customer_number (20번), phone_normalized (26번), line_blocked (29번) 포함
-- ============================================
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  primary_artist_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Customer info
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  customer_type customer_type DEFAULT 'local',

  -- 고객번호 (20번)
  customer_number VARCHAR(20),

  -- 전화번호 정규화 (26번)
  phone_normalized VARCHAR(20),

  -- Notes
  notes TEXT,
  internal_notes TEXT,

  -- Visit tracking
  last_visit DATE,
  total_visits INTEGER NOT NULL DEFAULT 0,
  total_spent DECIMAL(12, 2) NOT NULL DEFAULT 0,
  no_show_count INTEGER NOT NULL DEFAULT 0,

  -- LINE integration
  line_user_id TEXT,
  line_display_name TEXT,
  line_picture_url TEXT,

  -- LINE blocked (29번)
  line_blocked BOOLEAN NOT NULL DEFAULT false,

  -- Marketing
  acquisition_meta JSONB DEFAULT '{}'::jsonb,
  preferences JSONB DEFAULT '{}'::jsonb,
  marketing_consent BOOLEAN NOT NULL DEFAULT false,

  -- LINE opt-out (23번)
  opt_out BOOLEAN NOT NULL DEFAULT false,

  -- Extended fields (14번)
  birth_date DATE,
  gender gender_type DEFAULT 'unknown',
  occupation TEXT,
  tags customer_tag[] DEFAULT '{}',
  is_blacklisted BOOLEAN NOT NULL DEFAULT false,
  blacklist_reason TEXT,
  blacklisted_at TIMESTAMP WITH TIME ZONE,
  blacklisted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  secondary_phone VARCHAR(20),
  address TEXT,
  grade customer_grade DEFAULT 'BRONZE',
  grade_updated_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_customer_phone UNIQUE (salon_id, phone) DEFERRABLE INITIALLY DEFERRED
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_customers_salon ON customers(salon_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone) WHERE phone IS NOT NULL AND phone != '';
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(salon_id, name);
CREATE INDEX IF NOT EXISTS idx_customers_user ON customers(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_customers_primary_artist ON customers(primary_artist_id);
CREATE INDEX IF NOT EXISTS idx_customers_line_user ON customers(line_user_id) WHERE line_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_customers_acquisition ON customers USING gin (acquisition_meta jsonb_path_ops);
CREATE INDEX IF NOT EXISTS idx_customers_last_visit ON customers(salon_id, last_visit DESC);
CREATE INDEX IF NOT EXISTS idx_customers_total_spent ON customers(salon_id, total_spent DESC);
CREATE INDEX IF NOT EXISTS idx_customers_birth_date ON customers(EXTRACT(MONTH FROM birth_date), EXTRACT(DAY FROM birth_date));
CREATE INDEX IF NOT EXISTS idx_customers_tags ON customers USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_customers_blacklisted ON customers(salon_id) WHERE is_blacklisted = true;
CREATE INDEX IF NOT EXISTS idx_customers_phone_normalized ON customers(salon_id, phone_normalized) WHERE phone_normalized IS NOT NULL AND phone_normalized != '';
CREATE INDEX IF NOT EXISTS idx_customers_line_blocked ON customers(salon_id, line_blocked) WHERE line_blocked = true;

-- 고객번호 유니크 인덱스
CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_salon_number ON customers(salon_id, customer_number) WHERE customer_number IS NOT NULL;

-- phone_normalized 유니크 인덱스 (27번: 중복 제거 후 추가)
CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_phone_normalized_unique
  ON customers(salon_id, phone_normalized)
  WHERE phone_normalized IS NOT NULL AND phone_normalized != '';

COMMENT ON TABLE customers IS 'Salon-specific customer records with LINE integration and marketing data';
COMMENT ON COLUMN customers.customer_number IS '고객번호 (살롱별 고유)';
COMMENT ON COLUMN customers.phone_normalized IS 'Auto-populated by trigger: digits and + only, for consistent phone matching';
COMMENT ON COLUMN customers.line_blocked IS 'LINE 공식계정 차단(친구삭제) 여부 - webhook unfollow 이벤트로 자동 업데이트';

-- Add FK from users.customer_id to customers.id
ALTER TABLE users
  ADD CONSTRAINT fk_users_customer
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_customer_unique
  ON users(customer_id) WHERE customer_id IS NOT NULL;

-- ============================================
-- Customer Name History (26번)
-- ============================================
CREATE TABLE IF NOT EXISTS customer_name_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  old_name VARCHAR(100) NOT NULL,
  new_name VARCHAR(100) NOT NULL,
  changed_by TEXT NOT NULL,         -- 'web_booking', 'admin', 'line_sync'
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_name_history_customer ON customer_name_history(customer_id);

COMMENT ON TABLE customer_name_history IS 'Audit log for customer name changes across web and admin systems';

-- ============================================
-- Customer Groups (14번)
-- ============================================
CREATE TABLE IF NOT EXISTS customer_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,

  name VARCHAR(50) NOT NULL,
  name_en VARCHAR(50),
  name_th VARCHAR(50),

  color VARCHAR(7) DEFAULT '#6B7280',
  icon VARCHAR(50),
  description TEXT,

  group_type group_type NOT NULL DEFAULT 'MANUAL',
  auto_assign_rules JSONB DEFAULT NULL,
  auto_assign_enabled BOOLEAN NOT NULL DEFAULT false,
  last_auto_assigned_at TIMESTAMP WITH TIME ZONE,

  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  UNIQUE(salon_id, name)
);

CREATE INDEX IF NOT EXISTS idx_customer_groups_salon ON customer_groups(salon_id) WHERE is_active = true;

COMMENT ON TABLE customer_groups IS '살롱별 커스텀 고객 그룹';

-- ============================================
-- Customer Group Members (14번)
-- ============================================
CREATE TABLE IF NOT EXISTS customer_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES customer_groups(id) ON DELETE CASCADE,

  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  added_by UUID REFERENCES users(id) ON DELETE SET NULL,

  UNIQUE(customer_id, group_id)
);

CREATE INDEX IF NOT EXISTS idx_customer_group_members_customer ON customer_group_members(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_group_members_group ON customer_group_members(group_id);

COMMENT ON TABLE customer_group_members IS '고객-그룹 연결 (다대다)';

-- ============================================
-- Customer Filters (21번)
-- ============================================
CREATE TABLE IF NOT EXISTS customer_filters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,

  filter_key TEXT NOT NULL,
  is_system_filter BOOLEAN NOT NULL DEFAULT false,

  label TEXT NOT NULL,
  label_en TEXT,
  label_th TEXT,

  conditions JSONB NOT NULL DEFAULT '[]'::jsonb,
  condition_logic TEXT NOT NULL DEFAULT 'AND',

  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  UNIQUE(salon_id, filter_key)
);

CREATE INDEX IF NOT EXISTS idx_customer_filters_salon ON customer_filters(salon_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_customer_filters_order ON customer_filters(salon_id, display_order);

COMMENT ON TABLE customer_filters IS '살롱별 커스텀 고객 필터 설정';

-- ============================================
-- Service Categories
-- ============================================
CREATE TABLE IF NOT EXISTS service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  industry_id UUID REFERENCES industries(id) ON DELETE SET NULL,

  name TEXT NOT NULL,
  name_en TEXT,
  name_th TEXT,
  description TEXT,

  display_order INTEGER NOT NULL DEFAULT 0,

  is_active BOOLEAN NOT NULL DEFAULT true,
  deleted_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  UNIQUE(salon_id, name)
);

CREATE INDEX IF NOT EXISTS idx_service_categories_salon ON service_categories(salon_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_service_categories_active ON service_categories(is_active, salon_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_service_categories_industry ON service_categories(industry_id);

COMMENT ON TABLE service_categories IS 'Service categories for organizing services (CUT, PERM, COLOR, etc.)';

-- ============================================
-- Services (deposit_override, default_cycle_days 포함)
-- ============================================
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  category_id UUID REFERENCES service_categories(id) ON DELETE SET NULL,

  name TEXT NOT NULL,
  name_en TEXT,
  name_th TEXT,
  description TEXT,

  pricing_type TEXT NOT NULL DEFAULT 'POSITION_BASED',
  base_price DECIMAL(10, 2),
  duration_minutes INTEGER NOT NULL,

  image_url TEXT,

  is_active BOOLEAN NOT NULL DEFAULT true,
  deleted_at TIMESTAMP WITH TIME ZONE,

  display_order INTEGER NOT NULL DEFAULT 0,

  -- 예약금 오버라이드 (15번)
  deposit_override JSONB,

  -- 시술 주기 (23번)
  default_cycle_days INTEGER,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_pricing_type CHECK (pricing_type IN ('FIXED', 'POSITION_BASED')),
  CONSTRAINT fixed_price_required CHECK (
    (pricing_type = 'FIXED' AND base_price IS NOT NULL) OR
    (pricing_type = 'POSITION_BASED')
  ),
  UNIQUE (id, pricing_type)
);

CREATE INDEX IF NOT EXISTS idx_services_salon ON services(salon_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_services_active ON services(is_active, salon_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_services_pricing_type ON services(pricing_type);

COMMENT ON TABLE services IS 'Services offered by salons';
COMMENT ON COLUMN services.default_cycle_days IS '시술 권장 재방문 주기 (일). 예: 컷=30, 펌=90, 염색=45';

-- ============================================
-- Service Position Prices
-- ============================================
CREATE TABLE IF NOT EXISTS service_position_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL,
  position_id UUID NOT NULL REFERENCES staff_positions(id) ON DELETE CASCADE,

  pricing_type TEXT NOT NULL DEFAULT 'POSITION_BASED',
  price DECIMAL(10, 2) NOT NULL,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  UNIQUE(service_id, position_id),
  CONSTRAINT position_prices_type_check CHECK (pricing_type = 'POSITION_BASED'),
  FOREIGN KEY (service_id, pricing_type) REFERENCES services(id, pricing_type) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_service_position_prices_service ON service_position_prices(service_id);
CREATE INDEX IF NOT EXISTS idx_service_position_prices_position ON service_position_prices(position_id);

COMMENT ON TABLE service_position_prices IS 'Position-based pricing for services';

-- ============================================
-- Bookings (final state: all fields)
-- confirmed_by/at (12번), deposit fields (15번), membership fields (16번)
-- completed_at (23번), product_id/product_amount/store_sales_amount (24번)
-- cancelled_by (원래 06번에 포함), product_name (41번), sales_registered (42번)
-- ============================================
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  artist_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,

  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL,

  status booking_status NOT NULL DEFAULT 'PENDING',

  -- Pricing
  service_price DECIMAL(10, 2) NOT NULL,
  additional_charges DECIMAL(10, 2) DEFAULT 0,
  discount DECIMAL(10, 2) DEFAULT 0,
  total_price DECIMAL(10, 2) NOT NULL,

  -- Payment
  payment_status payment_status NOT NULL DEFAULT 'PENDING',
  payment_method TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,

  -- Notes
  customer_notes TEXT,
  staff_notes TEXT,

  -- Cancellation
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  cancelled_by UUID REFERENCES users(id) ON DELETE SET NULL,

  -- LINE notification
  line_notification_sent BOOLEAN NOT NULL DEFAULT false,
  line_notification_sent_at TIMESTAMP WITH TIME ZONE,

  -- Confirmation (12번)
  confirmed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  confirmed_at TIMESTAMP WITH TIME ZONE,

  -- Completion (23번)
  completed_at TIMESTAMP WITH TIME ZONE,

  -- Deposit fields (15번)
  deposit_required BOOLEAN NOT NULL DEFAULT false,
  deposit_amount DECIMAL(10,2),
  deposit_status deposit_status DEFAULT 'NOT_REQUIRED',
  deposit_paid_at TIMESTAMP WITH TIME ZONE,
  deposit_payment_method payment_method,
  deposit_transaction_id TEXT,
  deposit_refunded_at TIMESTAMP WITH TIME ZONE,
  deposit_refund_amount DECIMAL(10,2),
  deposit_forfeited_at TIMESTAMP WITH TIME ZONE,
  deposit_notes TEXT,
  deposit_expires_at TIMESTAMP WITH TIME ZONE,

  -- Membership fields (16번) — FK added after customer_memberships/membership_usages are created
  membership_id UUID,
  membership_usage_id UUID,
  deposit_exempt_by_membership BOOLEAN NOT NULL DEFAULT false,

  -- Product fields (24번) — FK added after salon_products is created
  product_id UUID,
  product_amount DECIMAL(10, 2) DEFAULT 0,
  store_sales_amount DECIMAL(10, 2) DEFAULT 0,

  -- Product name (41번)
  product_name TEXT,

  -- Sales registered (42번)
  sales_registered BOOLEAN NOT NULL DEFAULT false,

  -- Marketing metadata
  booking_meta JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_time_range CHECK (end_time > start_time),
  CONSTRAINT valid_total CHECK (total_price >= 0)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bookings_salon ON bookings(salon_id);
CREATE INDEX IF NOT EXISTS idx_bookings_customer ON bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_artist ON bookings(artist_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_artist_date ON bookings(artist_id, booking_date, start_time);
CREATE INDEX IF NOT EXISTS idx_bookings_meta ON bookings USING gin (booking_meta jsonb_path_ops);
CREATE INDEX IF NOT EXISTS idx_bookings_confirmed ON bookings(confirmed_at) WHERE confirmed_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bookings_deposit_status ON bookings(deposit_status) WHERE deposit_required = true;
CREATE INDEX IF NOT EXISTS idx_bookings_deposit_expires ON bookings(deposit_expires_at) WHERE deposit_status = 'PENDING';
CREATE INDEX IF NOT EXISTS idx_bookings_membership ON bookings(membership_id) WHERE membership_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bookings_sales ON bookings(salon_id, booking_date DESC) WHERE sales_registered = true;

COMMENT ON TABLE bookings IS 'Customer bookings/appointments';
COMMENT ON COLUMN bookings.artist_id IS 'Staff performing the service';
COMMENT ON COLUMN bookings.confirmed_by IS '예약을 확정한 스태프 ID';
COMMENT ON COLUMN bookings.product_id IS '시술에 사용된 제품 ID';
COMMENT ON COLUMN bookings.product_amount IS '제품금액 (시술 사용 제품 비용)';
COMMENT ON COLUMN bookings.store_sales_amount IS '점포 판매금액 (별도 소매 판매)';
COMMENT ON COLUMN bookings.product_name IS '판매된 제품명 요약 (복수인 경우 쉼표 구분)';
COMMENT ON COLUMN bookings.sales_registered IS '매출 등록 여부';
COMMENT ON COLUMN bookings.completed_at IS '시술 완료 처리된 시각';

-- ============================================
-- Reviews (extended fields from 13번)
-- ============================================
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE UNIQUE,
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  artist_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  images TEXT[] DEFAULT '{}',

  response TEXT,
  response_by UUID REFERENCES users(id) ON DELETE SET NULL,
  responded_at TIMESTAMP WITH TIME ZONE,

  is_visible BOOLEAN NOT NULL DEFAULT true,

  -- Extended ratings (13번)
  service_rating INTEGER CHECK (service_rating >= 1 AND service_rating <= 5),
  staff_rating INTEGER CHECK (staff_rating >= 1 AND staff_rating <= 5),
  cleanliness_rating INTEGER CHECK (cleanliness_rating >= 1 AND cleanliness_rating <= 5),
  value_rating INTEGER CHECK (value_rating >= 1 AND value_rating <= 5),

  -- Tags (13번)
  tags TEXT[] DEFAULT '{}',

  -- Likes (13번)
  likes_count INTEGER NOT NULL DEFAULT 0,

  -- Reports (13번)
  is_reported BOOLEAN NOT NULL DEFAULT false,
  report_count INTEGER NOT NULL DEFAULT 0,

  -- Edit tracking (13번)
  is_edited BOOLEAN NOT NULL DEFAULT false,
  edited_at TIMESTAMP WITH TIME ZONE,
  original_comment TEXT,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_salon ON reviews(salon_id) WHERE is_visible = true;
CREATE INDEX IF NOT EXISTS idx_reviews_artist ON reviews(artist_id) WHERE is_visible = true;
CREATE INDEX IF NOT EXISTS idx_reviews_customer ON reviews(customer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_tags ON reviews USING gin(tags);

COMMENT ON TABLE reviews IS 'Customer reviews for completed bookings';

-- ============================================
-- Review Likes (13번)
-- ============================================
CREATE TABLE IF NOT EXISTS review_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  UNIQUE(review_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_review_likes_review ON review_likes(review_id);
CREATE INDEX IF NOT EXISTS idx_review_likes_user ON review_likes(user_id);

COMMENT ON TABLE review_likes IS '리뷰 좋아요 기록';

-- ============================================
-- Review Reports (13번)
-- ============================================
CREATE TABLE IF NOT EXISTS review_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  reported_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  reason TEXT NOT NULL,
  reason_detail TEXT,

  status report_status NOT NULL DEFAULT 'PENDING',

  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_note TEXT,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_review_reports_review ON review_reports(review_id);
CREATE INDEX IF NOT EXISTS idx_review_reports_status ON review_reports(status);
CREATE INDEX IF NOT EXISTS idx_review_reports_created ON review_reports(created_at DESC);

COMMENT ON TABLE review_reports IS '리뷰 신고 기록';

-- ============================================
-- Product Categories (30번)
-- ============================================
CREATE TABLE IF NOT EXISTS product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_categories_salon ON product_categories(salon_id);

COMMENT ON TABLE product_categories IS '매장 제품 카테고리';

-- ============================================
-- Salon Products (24번, category_id는 30번)
-- ============================================
CREATE TABLE IF NOT EXISTS salon_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  name_en TEXT,
  name_th TEXT,
  description TEXT,

  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  stock_quantity INTEGER,

  -- category (30번)
  category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,

  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_salon_products_salon ON salon_products(salon_id);
CREATE INDEX IF NOT EXISTS idx_salon_products_active ON salon_products(salon_id, is_active);
CREATE INDEX IF NOT EXISTS idx_salon_products_category ON salon_products(category_id);

COMMENT ON TABLE salon_products IS '매장 판매 소매 제품 목록';

-- ============================================
-- Payments (15번)
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,

  payment_type payment_type NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'THB',

  payment_method payment_method NOT NULL,

  status payment_transaction_status NOT NULL DEFAULT 'PENDING',

  provider VARCHAR(50),
  provider_transaction_id TEXT,
  provider_response JSONB,

  promptpay_qr_code TEXT,
  promptpay_ref_id TEXT,

  refund_of UUID REFERENCES payments(id) ON DELETE SET NULL,
  refund_reason TEXT,

  metadata JSONB DEFAULT '{}'::jsonb,

  processed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  processed_at TIMESTAMP WITH TIME ZONE,

  error_code TEXT,
  error_message TEXT,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_salon ON payments(salon_id);
CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments(booking_id) WHERE booking_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payments_customer ON payments(customer_id) WHERE customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_type ON payments(payment_type);
CREATE INDEX IF NOT EXISTS idx_payments_created ON payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_provider_tx ON payments(provider, provider_transaction_id)
  WHERE provider_transaction_id IS NOT NULL;

COMMENT ON TABLE payments IS '모든 결제/환불 기록';

-- ============================================
-- Salon PromptPay Settings (15번)
-- ============================================
CREATE TABLE IF NOT EXISTS salon_promptpay_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE UNIQUE,

  promptpay_id TEXT NOT NULL,
  promptpay_type VARCHAR(10) NOT NULL,
  account_name TEXT NOT NULL,

  qr_code_image TEXT,

  bank_name TEXT,
  bank_account_number TEXT,

  is_active BOOLEAN NOT NULL DEFAULT true,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  verified_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE salon_promptpay_settings IS '살롱별 PromptPay 설정';

-- ============================================
-- Membership Plans (16번)
-- ============================================
CREATE TABLE IF NOT EXISTS membership_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,

  name VARCHAR(100) NOT NULL,
  name_en VARCHAR(100),
  name_th VARCHAR(100),
  description TEXT,
  image_url TEXT,

  membership_type membership_type NOT NULL,

  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2),
  currency VARCHAR(3) NOT NULL DEFAULT 'THB',

  -- COUNT_BASED
  total_count INTEGER,
  bonus_count INTEGER DEFAULT 0,

  -- TIME_BASED
  duration_days INTEGER,
  usage_limit INTEGER,

  -- AMOUNT_BASED
  total_amount DECIMAL(10,2),
  bonus_amount DECIMAL(10,2) DEFAULT 0,

  -- BUNDLE
  bundle_items JSONB,

  -- Applicable services
  all_services BOOLEAN NOT NULL DEFAULT false,
  applicable_service_ids UUID[],
  applicable_category_ids UUID[],

  -- Validity
  validity_days INTEGER,
  activation_type activation_type NOT NULL DEFAULT 'IMMEDIATE',

  -- Limits
  max_per_customer INTEGER,
  transferable BOOLEAN NOT NULL DEFAULT false,
  shareable BOOLEAN NOT NULL DEFAULT false,

  -- Deposit exempt
  deposit_exempt BOOLEAN NOT NULL DEFAULT true,

  -- Sale period
  sale_start_date DATE,
  sale_end_date DATE,
  is_limited_quantity BOOLEAN NOT NULL DEFAULT false,
  total_quantity INTEGER,
  sold_quantity INTEGER NOT NULL DEFAULT 0,

  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_membership_plans_salon ON membership_plans(salon_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_membership_plans_type ON membership_plans(membership_type);

COMMENT ON TABLE membership_plans IS '살롱별 정액권/멤버십 상품';

-- ============================================
-- Customer Memberships (16번)
-- ============================================
CREATE TABLE IF NOT EXISTS customer_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES membership_plans(id) ON DELETE RESTRICT,

  membership_number VARCHAR(50) NOT NULL,

  purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  purchased_by UUID REFERENCES users(id) ON DELETE SET NULL,
  payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,

  purchase_price DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'THB',

  starts_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  activation_type activation_type NOT NULL DEFAULT 'IMMEDIATE',

  initial_count INTEGER,
  remaining_count INTEGER,
  used_count INTEGER NOT NULL DEFAULT 0,

  initial_amount DECIMAL(10,2),
  remaining_amount DECIMAL(10,2),
  used_amount DECIMAL(10,2) NOT NULL DEFAULT 0,

  bundle_remaining JSONB,

  status membership_status NOT NULL DEFAULT 'ACTIVE',

  suspended_at TIMESTAMP WITH TIME ZONE,
  suspended_until TIMESTAMP WITH TIME ZONE,
  suspension_reason TEXT,
  total_suspension_days INTEGER NOT NULL DEFAULT 0,

  refunded_at TIMESTAMP WITH TIME ZONE,
  refund_amount DECIMAL(10,2),
  refund_reason TEXT,
  refund_payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,

  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancel_reason TEXT,
  cancelled_by UUID REFERENCES users(id) ON DELETE SET NULL,

  notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  UNIQUE(salon_id, membership_number)
);

CREATE INDEX IF NOT EXISTS idx_customer_memberships_salon ON customer_memberships(salon_id);
CREATE INDEX IF NOT EXISTS idx_customer_memberships_customer ON customer_memberships(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_memberships_status ON customer_memberships(status) WHERE status = 'ACTIVE';
CREATE INDEX IF NOT EXISTS idx_customer_memberships_expires ON customer_memberships(expires_at)
  WHERE status = 'ACTIVE' AND expires_at IS NOT NULL;

COMMENT ON TABLE customer_memberships IS '고객이 보유한 정액권';

-- ============================================
-- Membership Usages (16번)
-- ============================================
CREATE TABLE IF NOT EXISTS membership_usages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  membership_id UUID NOT NULL REFERENCES customer_memberships(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,

  count_used INTEGER,
  amount_used DECIMAL(10,2),

  remaining_count_after INTEGER,
  remaining_amount_after DECIMAL(10,2),

  used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  processed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,

  is_cancelled BOOLEAN NOT NULL DEFAULT false,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancel_reason TEXT,
  cancelled_by UUID REFERENCES users(id) ON DELETE SET NULL,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_membership_usages_membership ON membership_usages(membership_id);
CREATE INDEX IF NOT EXISTS idx_membership_usages_booking ON membership_usages(booking_id) WHERE booking_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_membership_usages_used_at ON membership_usages(used_at DESC);

COMMENT ON TABLE membership_usages IS '정액권 사용 내역';

-- ============================================
-- Notifications (booking_id FK는 CASCADE DELETE - 43번)
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,  -- 43번: CASCADE

  recipient_type recipient_type NOT NULL,
  recipient_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  recipient_customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,

  notification_type notification_type NOT NULL,
  channel notification_channel NOT NULL,

  title TEXT,
  body TEXT NOT NULL,

  metadata JSONB DEFAULT '{}'::jsonb,

  status notification_status NOT NULL DEFAULT 'PENDING',

  scheduled_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,

  error_code TEXT,
  error_message TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,

  external_message_id TEXT,
  external_response JSONB,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_salon ON notifications(salon_id);
CREATE INDEX IF NOT EXISTS idx_notifications_booking ON notifications(booking_id) WHERE booking_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_user ON notifications(recipient_user_id) WHERE recipient_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_customer ON notifications(recipient_customer_id) WHERE recipient_customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled ON notifications(scheduled_at) WHERE status = 'PENDING' AND scheduled_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
-- 33번: 성능 최적화 인덱스
CREATE INDEX IF NOT EXISTS idx_notifications_dup_check
  ON notifications(booking_id, notification_type, channel, created_at DESC)
  WHERE booking_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_admin_inbox
  ON notifications(salon_id, channel, recipient_type, created_at DESC)
  WHERE channel = 'IN_APP' AND recipient_type = 'ADMIN';

COMMENT ON TABLE notifications IS '알림 발송 로그. 모든 알림(LINE, SMS, Email 등)의 발송 기록을 저장';

-- Realtime 활성화 (37번)
ALTER TABLE notifications REPLICA IDENTITY FULL;

-- ============================================
-- Notification Outbox (booking_id FK는 CASCADE DELETE - 43번)
-- ============================================
CREATE TABLE IF NOT EXISTS notification_outbox (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  notification_id       UUID REFERENCES notifications(id) ON DELETE SET NULL,

  salon_id              UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  booking_id            UUID REFERENCES bookings(id) ON DELETE CASCADE,  -- 43번: CASCADE

  channel               notification_channel NOT NULL DEFAULT 'LINE',
  notification_type     notification_type NOT NULL,

  recipient_line_user_id TEXT,
  recipient_customer_id  UUID REFERENCES customers(id) ON DELETE SET NULL,

  payload               JSONB NOT NULL,

  idempotency_key       TEXT UNIQUE NOT NULL,

  status                outbox_status NOT NULL DEFAULT 'pending',

  attempt_count         SMALLINT NOT NULL DEFAULT 0,
  max_attempts          SMALLINT NOT NULL DEFAULT 5,
  next_retry_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  last_error            TEXT,
  sent_at               TIMESTAMPTZ,

  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_outbox_pending
  ON notification_outbox(next_retry_at)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_outbox_salon
  ON notification_outbox(salon_id);

CREATE INDEX IF NOT EXISTS idx_outbox_booking
  ON notification_outbox(booking_id)
  WHERE booking_id IS NOT NULL;

COMMENT ON TABLE notification_outbox IS 'LINE/Email 등 외부 채널 발송 Job 큐. Outbox 패턴으로 누락/중복 방지.';
COMMENT ON COLUMN notification_outbox.idempotency_key IS '중복 발송 방지 키. 형식: {booking_id}:{type}:{YYYY-MM-DD}';

-- ============================================
-- Salon LINE Settings (12번)
-- ============================================
CREATE TABLE IF NOT EXISTS salon_line_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE UNIQUE,

  line_channel_id TEXT NOT NULL,
  line_channel_secret TEXT NOT NULL,
  line_channel_access_token TEXT NOT NULL,

  liff_id TEXT,

  webhook_url TEXT,
  webhook_secret TEXT,

  is_active BOOLEAN NOT NULL DEFAULT true,
  is_verified BOOLEAN NOT NULL DEFAULT false,

  last_verified_at TIMESTAMP WITH TIME ZONE,
  verification_error TEXT,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE salon_line_settings IS '살롱별 LINE 공식계정 연동 설정';

-- ============================================
-- Customer Cycles (23번)
-- ============================================
CREATE TABLE IF NOT EXISTS customer_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  cycle_days INTEGER NOT NULL DEFAULT 30,
  last_completed_at TIMESTAMP WITH TIME ZONE,
  next_due_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(salon_id, customer_id, service_id)
);

CREATE INDEX IF NOT EXISTS idx_customer_cycles_next_due
  ON customer_cycles(next_due_at) WHERE next_due_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_customer_cycles_customer
  ON customer_cycles(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_cycles_salon
  ON customer_cycles(salon_id);

COMMENT ON TABLE customer_cycles IS '고객별 시술 주기 관리. 마지막 시술일 기반으로 다음 방문 예정일 계산';

-- ============================================
-- Message Jobs (23번)
-- ============================================
CREATE TABLE IF NOT EXISTS message_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  job_type TEXT NOT NULL CHECK (job_type IN ('rebook_due', 'rebook_overdue', 'reminder_24h', 'reminder_3h')),
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'skipped')),
  sent_at TIMESTAMP WITH TIME ZONE,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_message_jobs_status_scheduled
  ON message_jobs(status, scheduled_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_message_jobs_customer_type_sent
  ON message_jobs(customer_id, job_type, sent_at);
CREATE INDEX IF NOT EXISTS idx_message_jobs_salon
  ON message_jobs(salon_id);
CREATE INDEX IF NOT EXISTS idx_message_jobs_booking
  ON message_jobs(booking_id) WHERE booking_id IS NOT NULL;

COMMENT ON TABLE message_jobs IS 'LINE Push 메시지 발송 큐. 스케줄러가 주기적으로 처리';

-- ============================================
-- Message Events (23번)
-- ============================================
CREATE TABLE IF NOT EXISTS message_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_job_id UUID NOT NULL REFERENCES message_jobs(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('sent', 'clicked', 'converted')),
  event_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_message_events_job
  ON message_events(message_job_id);
CREATE INDEX IF NOT EXISTS idx_message_events_type
  ON message_events(event_type, event_at);

COMMENT ON TABLE message_events IS '메시지 이벤트 로깅. sent=발송, clicked=링크클릭, converted=예약전환';

-- ============================================
-- Portfolio Items (19번, artist_id로 변경된 최종 상태 - 40번)
-- ============================================
CREATE TABLE IF NOT EXISTS portfolio_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,  -- 40번: designer_id → artist_id

  source_type VARCHAR(20) NOT NULL DEFAULT 'manual',
  source_id VARCHAR(100),

  image_url TEXT NOT NULL,
  thumbnail_url TEXT,

  caption TEXT,
  tags TEXT[],

  display_order INTEGER NOT NULL DEFAULT 0,
  is_public BOOLEAN NOT NULL DEFAULT true,

  instagram_permalink TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_portfolio_artist ON portfolio_items(artist_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_display_order ON portfolio_items(artist_id, display_order);
CREATE INDEX IF NOT EXISTS idx_portfolio_source ON portfolio_items(artist_id, source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_public ON portfolio_items(artist_id, is_public) WHERE is_public = true;

CREATE UNIQUE INDEX IF NOT EXISTS idx_portfolio_instagram_unique
  ON portfolio_items(artist_id, source_id)
  WHERE source_type = 'instagram' AND source_id IS NOT NULL;

COMMENT ON TABLE portfolio_items IS '아티스트 포트폴리오 아이템';

-- ============================================
-- Artist Instagram Tokens (19번)
-- ============================================
CREATE TABLE IF NOT EXISTS artist_instagram_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  instagram_user_id VARCHAR(100) NOT NULL,
  access_token TEXT NOT NULL,

  expires_at TIMESTAMPTZ NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(artist_id)
);

CREATE INDEX IF NOT EXISTS idx_instagram_tokens_artist ON artist_instagram_tokens(artist_id);
CREATE INDEX IF NOT EXISTS idx_instagram_tokens_expires ON artist_instagram_tokens(expires_at);

COMMENT ON TABLE artist_instagram_tokens IS 'Instagram Long-lived 토큰 저장';

-- ============================================
-- User Favorite Salons (07번)
-- ============================================
CREATE TABLE IF NOT EXISTS user_favorite_salons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, salon_id)
);

CREATE INDEX IF NOT EXISTS idx_user_favorites_user ON user_favorite_salons(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_salon ON user_favorite_salons(salon_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_created ON user_favorite_salons(created_at DESC);

COMMENT ON TABLE user_favorite_salons IS 'User favorite/bookmarked salons';

-- ============================================
-- User Favorite Artists (07번)
-- ============================================
CREATE TABLE IF NOT EXISTS user_favorite_artists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  artist_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, artist_id)
);

CREATE INDEX IF NOT EXISTS idx_user_favorite_artists_user ON user_favorite_artists(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorite_artists_artist ON user_favorite_artists(artist_id);
CREATE INDEX IF NOT EXISTS idx_user_favorite_artists_created ON user_favorite_artists(created_at DESC);

COMMENT ON TABLE user_favorite_artists IS 'User favorite/bookmarked artists';

-- ============================================
-- Message Job Stats View (23번)
-- ============================================
CREATE OR REPLACE VIEW v_message_job_stats AS
SELECT
  mj.salon_id,
  mj.job_type,
  DATE_TRUNC('day', mj.created_at) AS day,
  COUNT(*) FILTER (WHERE mj.status = 'sent') AS sent_count,
  COUNT(*) FILTER (WHERE mj.status = 'failed') AS failed_count,
  COUNT(*) FILTER (WHERE mj.status = 'skipped') AS skipped_count,
  COUNT(*) FILTER (WHERE mj.status = 'pending') AS pending_count,
  COUNT(DISTINCT me.id) FILTER (WHERE me.event_type = 'clicked') AS click_count,
  COUNT(DISTINCT me.id) FILTER (WHERE me.event_type = 'converted') AS conversion_count
FROM message_jobs mj
LEFT JOIN message_events me ON me.message_job_id = mj.id
GROUP BY mj.salon_id, mj.job_type, DATE_TRUNC('day', mj.created_at);

COMMENT ON VIEW v_message_job_stats IS '살롱별/타입별/일별 메시지 발송 지표';

-- ============================================
-- Deferred FK: bookings → customer_memberships / membership_usages
-- (tables defined after bookings, added here)
-- ============================================
ALTER TABLE bookings
  ADD CONSTRAINT fk_bookings_membership
    FOREIGN KEY (membership_id) REFERENCES customer_memberships(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_bookings_membership_usage
    FOREIGN KEY (membership_usage_id) REFERENCES membership_usages(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_bookings_product
    FOREIGN KEY (product_id) REFERENCES salon_products(id) ON DELETE SET NULL;
