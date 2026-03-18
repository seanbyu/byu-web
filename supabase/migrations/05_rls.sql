-- ============================================
-- 05_rls.sql
-- 모든 테이블 RLS 활성화 + 최종 정책 (최신 버전)
-- ============================================

-- ============================================
-- Role Grants (schema reset 후 권한 복구)
-- ============================================
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO anon;

-- ============================================
-- Industries & Salon Industries
-- ============================================

ALTER TABLE industries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Industries are viewable by everyone" ON industries;
CREATE POLICY "Industries are viewable by everyone"
  ON industries FOR SELECT USING (true);

ALTER TABLE salon_industries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Salon industries viewable by everyone"
  ON salon_industries FOR SELECT USING (true);

CREATE POLICY "Salon admins can manage salon industries"
  ON salon_industries FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM staff_profiles sp JOIN users u ON u.id = sp.user_id
      WHERE sp.user_id = auth.uid() AND sp.salon_id = salon_industries.salon_id
        AND u.role IN ('ADMIN', 'MANAGER', 'SUPER_ADMIN')
    )
  );

-- ============================================
-- Salon Images
-- ============================================

ALTER TABLE salon_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view salon images"
  ON salon_images FOR SELECT USING (true);

CREATE POLICY "Salon admins can manage salon images"
  ON salon_images FOR ALL
  USING (salon_id = get_my_salon_id() AND get_my_role() IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER'));

-- ============================================
-- Salons
-- ============================================

ALTER TABLE salons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active salons" ON salons;
CREATE POLICY "Anyone can view active salons"
  ON salons FOR SELECT USING (is_active = true AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Super admins can manage all salons" ON salons;
CREATE POLICY "Super admins can manage all salons"
  ON salons FOR ALL USING (get_my_role() = 'SUPER_ADMIN');

DROP POLICY IF EXISTS "Admins can update their own salon" ON salons;
CREATE POLICY "Admins can update their own salon"
  ON salons FOR UPDATE
  USING (id = get_my_salon_id() AND get_my_role() IN ('ADMIN', 'MANAGER'));

-- ============================================
-- Users
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON users;
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Super admins can view all users" ON users;
CREATE POLICY "Super admins can view all users"
  ON users FOR SELECT USING (get_my_role() = 'SUPER_ADMIN');

CREATE POLICY "Users can view same salon users"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM staff_profiles my_sp
      JOIN staff_profiles their_sp ON my_sp.salon_id = their_sp.salon_id
      WHERE my_sp.user_id = auth.uid() AND their_sp.user_id = users.id
    )
  );

CREATE POLICY "Public can view active salon staff"
  ON users FOR SELECT
  USING (
    user_type = 'SALON' AND is_active = true
    AND EXISTS (SELECT 1 FROM staff_profiles sp WHERE sp.user_id = users.id AND sp.salon_id IS NOT NULL)
  );

DROP POLICY IF EXISTS "Users can update their own profile" ON users;
CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can create users in their salon" ON users;
CREATE POLICY "Admins can create users in their salon"
  ON users FOR INSERT
  WITH CHECK (get_my_role() IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER'));

-- 고객이 자신의 행을 직접 생성할 수 있도록 허용 (트리거/RPC 실패 시 API 폴백용)
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
CREATE POLICY "Users can insert their own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id AND user_type = 'CUSTOMER' AND role = 'CUSTOMER');

-- ============================================
-- Staff Positions
-- ============================================

ALTER TABLE staff_positions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active positions" ON staff_positions;
CREATE POLICY "Anyone can view active positions"
  ON staff_positions FOR SELECT USING (is_active = true);

CREATE POLICY "Salon admins can manage positions"
  ON staff_positions FOR ALL
  USING (salon_id = get_my_salon_id() AND get_my_role() IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER'));

-- ============================================
-- Staff Profiles
-- ============================================

ALTER TABLE staff_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff users can view their own profile" ON staff_profiles;
CREATE POLICY "Staff users can view their own profile"
  ON staff_profiles FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Staff users in same salon can view each other"
  ON staff_profiles FOR SELECT USING (salon_id = get_my_salon_id());

DROP POLICY IF EXISTS "Public can view staff profiles for bookings" ON staff_profiles;
CREATE POLICY "Public can view staff profiles for bookings"
  ON staff_profiles FOR SELECT USING (is_booking_enabled = true);

DROP POLICY IF EXISTS "Admins and Managers can update staff profiles" ON staff_profiles;
CREATE POLICY "Admins and Managers can update staff profiles"
  ON staff_profiles FOR UPDATE
  USING (get_my_role() IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER') AND salon_id = get_my_salon_id());

DROP POLICY IF EXISTS "Admins and Managers can insert staff profiles" ON staff_profiles;
CREATE POLICY "Admins and Managers can insert staff profiles"
  ON staff_profiles FOR INSERT
  WITH CHECK (get_my_role() IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER') AND salon_id = get_my_salon_id());

-- ============================================
-- Customers (22번 최신 — 유연한 정책)
-- ============================================

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view customers" ON customers;
CREATE POLICY "Anyone can view customers"
  ON customers FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert customers" ON customers;
CREATE POLICY "Authenticated users can insert customers"
  ON customers FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Salon staff can update their customers"
  ON customers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM staff_profiles sp
      WHERE sp.user_id = auth.uid() AND sp.salon_id = customers.salon_id
    )
  );

CREATE POLICY "Salon staff can delete their customers"
  ON customers FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM staff_profiles sp
      WHERE sp.user_id = auth.uid() AND sp.salon_id = customers.salon_id
    )
  );

-- ============================================
-- Customer Name History
-- ============================================

ALTER TABLE customer_name_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Salon staff can view name history"
  ON customer_name_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM customers c JOIN staff_profiles sp ON sp.salon_id = c.salon_id
      WHERE c.id = customer_name_history.customer_id AND sp.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Service role can insert name history" ON customer_name_history;
CREATE POLICY "Service role can insert name history"
  ON customer_name_history FOR INSERT WITH CHECK (true);

-- ============================================
-- Customer Filters
-- ============================================

ALTER TABLE customer_filters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Salon staff can view their filters"
  ON customer_filters FOR SELECT USING (salon_id = get_my_salon_id());

CREATE POLICY "Salon managers can manage their filters"
  ON customer_filters FOR ALL
  USING (salon_id = get_my_salon_id() AND get_my_role() IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER'));

-- ============================================
-- Customer Groups
-- ============================================

ALTER TABLE customer_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Salon staff can view customer groups"
  ON customer_groups FOR SELECT USING (salon_id = get_my_salon_id());

CREATE POLICY "Salon managers can manage customer groups"
  ON customer_groups FOR ALL
  USING (salon_id = get_my_salon_id() AND get_my_role() IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER'));

ALTER TABLE customer_group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Salon staff can view group members"
  ON customer_group_members FOR SELECT
  USING (
    group_id IN (SELECT id FROM customer_groups WHERE salon_id = get_my_salon_id())
  );

CREATE POLICY "Salon managers can manage group members"
  ON customer_group_members FOR ALL
  USING (
    group_id IN (SELECT id FROM customer_groups WHERE salon_id = get_my_salon_id())
    AND get_my_role() IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER')
  );

-- ============================================
-- Service Categories
-- ============================================

ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active categories" ON service_categories;
CREATE POLICY "Anyone can view active categories"
  ON service_categories FOR SELECT USING (is_active = true AND deleted_at IS NULL);

CREATE POLICY "Salon managers can manage their categories"
  ON service_categories FOR ALL
  USING (salon_id = get_my_salon_id() AND get_my_role() IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER'));

-- ============================================
-- Services
-- ============================================

ALTER TABLE services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active services" ON services;
CREATE POLICY "Anyone can view active services"
  ON services FOR SELECT USING (is_active = true AND deleted_at IS NULL);

CREATE POLICY "Salon managers can manage their services"
  ON services FOR ALL
  USING (salon_id = get_my_salon_id() AND get_my_role() IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER'));

-- ============================================
-- Service Position Prices
-- ============================================

ALTER TABLE service_position_prices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view service prices" ON service_position_prices;
CREATE POLICY "Anyone can view service prices"
  ON service_position_prices FOR SELECT USING (true);

CREATE POLICY "Salon managers can manage service prices"
  ON service_position_prices FOR ALL
  USING (
    service_id IN (SELECT id FROM services WHERE salon_id = get_my_salon_id())
    AND get_my_role() IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER')
  );

-- ============================================
-- Bookings
-- ============================================

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers can view their own bookings" ON bookings;
CREATE POLICY "Customers can view their own bookings"
  ON bookings FOR SELECT
  USING (EXISTS (SELECT 1 FROM customers c WHERE c.id = bookings.customer_id AND c.user_id = auth.uid()));

DROP POLICY IF EXISTS "Artists can view their own bookings" ON bookings;
CREATE POLICY "Artists can view their own bookings"
  ON bookings FOR SELECT USING (auth.uid() = artist_id);

CREATE POLICY "Salon staff can view salon bookings"
  ON bookings FOR SELECT USING (salon_id = get_my_salon_id());

DROP POLICY IF EXISTS "Customers can create bookings" ON bookings;
CREATE POLICY "Customers can create bookings"
  ON bookings FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM customers c WHERE c.id = bookings.customer_id AND c.user_id = auth.uid()));

DROP POLICY IF EXISTS "Customers can update their pending bookings" ON bookings;
CREATE POLICY "Customers can update their pending bookings"
  ON bookings FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM customers c WHERE c.id = bookings.customer_id AND c.user_id = auth.uid())
    AND status = 'PENDING'
  );

CREATE POLICY "Salon staff can manage salon bookings"
  ON bookings FOR ALL
  USING (salon_id = get_my_salon_id() AND get_my_role() IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STAFF'));

-- ============================================
-- Reviews
-- ============================================

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view visible reviews" ON reviews;
CREATE POLICY "Anyone can view visible reviews"
  ON reviews FOR SELECT USING (is_visible = true);

DROP POLICY IF EXISTS "Customers can create reviews for completed bookings" ON reviews;
CREATE POLICY "Customers can create reviews for completed bookings"
  ON reviews FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM customers c WHERE c.id = reviews.customer_id AND c.user_id = auth.uid())
    AND EXISTS (SELECT 1 FROM bookings WHERE id = booking_id AND status = 'COMPLETED')
  );

DROP POLICY IF EXISTS "Customers can update their own reviews" ON reviews;
CREATE POLICY "Customers can update their own reviews"
  ON reviews FOR UPDATE
  USING (EXISTS (SELECT 1 FROM customers c WHERE c.id = reviews.customer_id AND c.user_id = auth.uid()));

CREATE POLICY "Salon staff can respond to reviews"
  ON reviews FOR UPDATE USING (salon_id = get_my_salon_id());

-- ============================================
-- Salon Products & Product Categories
-- ============================================

ALTER TABLE salon_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Salon staff can view their products"
  ON salon_products FOR SELECT USING (salon_id = get_my_salon_id());

CREATE POLICY "Salon managers can manage their products"
  ON salon_products FOR ALL
  USING (salon_id = get_my_salon_id() AND get_my_role() IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER'));

ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Salon staff can view product categories"
  ON product_categories FOR SELECT USING (salon_id = get_my_salon_id());

CREATE POLICY "Salon managers can manage product categories"
  ON product_categories FOR ALL
  USING (salon_id = get_my_salon_id() AND get_my_role() IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER'));

-- ============================================
-- Payments & PromptPay Settings
-- ============================================

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Salon staff can view their payments"
  ON payments FOR SELECT USING (salon_id = get_my_salon_id());

DROP POLICY IF EXISTS "Customers can view their own payments" ON payments;
CREATE POLICY "Customers can view their own payments"
  ON payments FOR SELECT
  USING (customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid()));

CREATE POLICY "Salon staff can create payments"
  ON payments FOR INSERT
  WITH CHECK (
    salon_id = get_my_salon_id()
    AND get_my_role() IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'ARTIST', 'STAFF')
  );

CREATE POLICY "Salon managers can update payments"
  ON payments FOR UPDATE
  USING (salon_id = get_my_salon_id() AND get_my_role() IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER'));

ALTER TABLE salon_promptpay_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Salon admins can view their PromptPay settings"
  ON salon_promptpay_settings FOR SELECT
  USING (salon_id = get_my_salon_id() AND get_my_role() IN ('SUPER_ADMIN', 'ADMIN'));

CREATE POLICY "Salon admins can manage their PromptPay settings"
  ON salon_promptpay_settings FOR ALL
  USING (salon_id = get_my_salon_id() AND get_my_role() IN ('SUPER_ADMIN', 'ADMIN'));

-- ============================================
-- Membership Plans / Customer Memberships / Usages
-- ============================================

ALTER TABLE membership_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active membership plans" ON membership_plans;
CREATE POLICY "Anyone can view active membership plans"
  ON membership_plans FOR SELECT USING (is_active = true);

CREATE POLICY "Salon admins can manage membership plans"
  ON membership_plans FOR ALL
  USING (salon_id = get_my_salon_id() AND get_my_role() IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER'));

ALTER TABLE customer_memberships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers can view their own memberships" ON customer_memberships;
CREATE POLICY "Customers can view their own memberships"
  ON customer_memberships FOR SELECT
  USING (customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid()));

CREATE POLICY "Salon staff can view customer memberships"
  ON customer_memberships FOR SELECT USING (salon_id = get_my_salon_id());

CREATE POLICY "Salon staff can manage customer memberships"
  ON customer_memberships FOR ALL
  USING (
    salon_id = get_my_salon_id()
    AND get_my_role() IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'ARTIST', 'STAFF')
  );

ALTER TABLE membership_usages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers can view their own usage history" ON membership_usages;
CREATE POLICY "Customers can view their own usage history"
  ON membership_usages FOR SELECT
  USING (
    membership_id IN (
      SELECT cm.id FROM customer_memberships cm JOIN customers c ON c.id = cm.customer_id WHERE c.user_id = auth.uid()
    )
  );

CREATE POLICY "Salon staff can view usage history"
  ON membership_usages FOR SELECT
  USING (membership_id IN (SELECT id FROM customer_memberships WHERE salon_id = get_my_salon_id()));

CREATE POLICY "Salon staff can create usage records"
  ON membership_usages FOR INSERT
  WITH CHECK (
    membership_id IN (SELECT id FROM customer_memberships WHERE salon_id = get_my_salon_id())
    AND get_my_role() IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'ARTIST', 'STAFF')
  );

-- ============================================
-- Notifications (32번 최신 — hardened)
-- ============================================

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 스태프: 자기 살롱 관리자성 알림만 조회
DROP POLICY IF EXISTS "notifications_staff_select" ON notifications;
CREATE POLICY "notifications_staff_select"
  ON notifications FOR SELECT TO authenticated
  USING (salon_id = get_my_salon_id() AND recipient_type IN ('ADMIN', 'STAFF', 'ARTIST'));

-- 고객: 본인 알림만 조회
DROP POLICY IF EXISTS "notifications_customer_select" ON notifications;
CREATE POLICY "notifications_customer_select"
  ON notifications FOR SELECT TO authenticated
  USING (recipient_customer_id IN (SELECT c.id FROM customers c WHERE c.user_id = auth.uid()));

-- 클라이언트 직접 INSERT 금지 (트리거/service_role만 생성)
DROP POLICY IF EXISTS "notifications_no_direct_insert" ON notifications;
CREATE POLICY "notifications_no_direct_insert"
  ON notifications FOR INSERT TO authenticated WITH CHECK (false);

-- 스태프: 자기 살롱 IN_APP 알림 업데이트 (읽음 처리)
DROP POLICY IF EXISTS "notifications_staff_update" ON notifications;
CREATE POLICY "notifications_staff_update"
  ON notifications FOR UPDATE TO authenticated
  USING (
    salon_id = get_my_salon_id()
    AND channel = 'IN_APP'
    AND recipient_type IN ('ADMIN', 'STAFF', 'ARTIST')
  )
  WITH CHECK (
    salon_id = get_my_salon_id()
    AND channel = 'IN_APP'
    AND recipient_type IN ('ADMIN', 'STAFF', 'ARTIST')
  );

-- 고객: 본인 알림 업데이트 (읽음 처리)
DROP POLICY IF EXISTS "notifications_customer_update" ON notifications;
CREATE POLICY "notifications_customer_update"
  ON notifications FOR UPDATE TO authenticated
  USING (recipient_customer_id IN (SELECT c.id FROM customers c WHERE c.user_id = auth.uid()))
  WITH CHECK (recipient_customer_id IN (SELECT c.id FROM customers c WHERE c.user_id = auth.uid()));

-- 스태프: 자기 살롱 IN_APP 알림 삭제
DROP POLICY IF EXISTS "notifications_staff_delete" ON notifications;
CREATE POLICY "notifications_staff_delete"
  ON notifications FOR DELETE TO authenticated
  USING (
    salon_id = get_my_salon_id()
    AND channel = 'IN_APP'
    AND recipient_type IN ('ADMIN', 'STAFF', 'ARTIST')
  );

-- ============================================
-- Notification Outbox (service_role 전용)
-- ============================================

ALTER TABLE notification_outbox ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "outbox_no_direct_access" ON notification_outbox;
CREATE POLICY "outbox_no_direct_access"
  ON notification_outbox FOR ALL
  USING (false)
  WITH CHECK (false);

-- ============================================
-- Salon LINE Settings
-- ============================================

ALTER TABLE salon_line_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Salon admins can view their LINE settings"
  ON salon_line_settings FOR SELECT
  USING (salon_id = get_my_salon_id() AND get_my_role() IN ('SUPER_ADMIN', 'ADMIN'));

CREATE POLICY "Salon admins can manage their LINE settings"
  ON salon_line_settings FOR ALL
  USING (salon_id = get_my_salon_id() AND get_my_role() IN ('SUPER_ADMIN', 'ADMIN'));

-- ============================================
-- Customer Cycles (LINE 자동화)
-- ============================================

ALTER TABLE customer_cycles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Salon staff can view their customer_cycles"
  ON customer_cycles FOR SELECT USING (salon_id = get_my_salon_id());

CREATE POLICY "Salon staff can manage their customer_cycles"
  ON customer_cycles FOR ALL USING (salon_id = get_my_salon_id());

-- ============================================
-- Message Jobs / Events
-- ============================================

ALTER TABLE message_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Salon staff can view their message_jobs"
  ON message_jobs FOR SELECT USING (salon_id = get_my_salon_id());

ALTER TABLE message_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Salon staff can view their message_events"
  ON message_events FOR SELECT
  USING (message_job_id IN (SELECT id FROM message_jobs WHERE salon_id = get_my_salon_id()));

-- ============================================
-- User Identities
-- ============================================

ALTER TABLE user_identities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own identities" ON user_identities;
CREATE POLICY "Users can view own identities"
  ON user_identities FOR SELECT
  USING (
    user_id IN (SELECT id FROM users WHERE id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM staff_profiles sp
      WHERE sp.user_id = auth.uid()
        AND sp.salon_id IN (SELECT salon_id FROM staff_profiles WHERE user_id = user_identities.user_id)
        AND get_my_role() IN ('SUPER_ADMIN', 'ADMIN')
    )
  );

DROP POLICY IF EXISTS "Users can create own identities" ON user_identities;
CREATE POLICY "Users can create own identities"
  ON user_identities FOR INSERT
  WITH CHECK (user_id IN (SELECT id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can update own identities" ON user_identities;
CREATE POLICY "Users can update own identities"
  ON user_identities FOR UPDATE
  USING (user_id IN (SELECT id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete own identities" ON user_identities;
CREATE POLICY "Users can delete own identities"
  ON user_identities FOR DELETE
  USING (
    user_id IN (SELECT id FROM users WHERE id = auth.uid())
    AND is_primary = false
  );

-- ============================================
-- Favorites
-- ============================================

ALTER TABLE user_favorite_salons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own favorites" ON user_favorite_salons;
CREATE POLICY "Users can view their own favorites"
  ON user_favorite_salons FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can add favorites" ON user_favorite_salons;
CREATE POLICY "Users can add favorites"
  ON user_favorite_salons FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove their own favorites" ON user_favorite_salons;
CREATE POLICY "Users can remove their own favorites"
  ON user_favorite_salons FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Salon admins can view their salon favorites"
  ON user_favorite_salons FOR SELECT
  USING (salon_id = get_my_salon_id() AND get_my_role() IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER'));

ALTER TABLE user_favorite_artists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own favorite artists" ON user_favorite_artists;
CREATE POLICY "Users can view their own favorite artists"
  ON user_favorite_artists FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can add favorite artists" ON user_favorite_artists;
CREATE POLICY "Users can add favorite artists"
  ON user_favorite_artists FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove their own favorite artists" ON user_favorite_artists;
CREATE POLICY "Users can remove their own favorite artists"
  ON user_favorite_artists FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Artists can view who favorited them" ON user_favorite_artists;
CREATE POLICY "Artists can view who favorited them"
  ON user_favorite_artists FOR SELECT USING (auth.uid() = artist_id);

CREATE POLICY "Salon admins can view their artists favorites"
  ON user_favorite_artists FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM staff_profiles sp
      WHERE sp.user_id = user_favorite_artists.artist_id AND sp.salon_id = get_my_salon_id()
    )
    AND get_my_role() IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER')
  );

-- ============================================
-- Portfolio
-- ============================================

ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view portfolio items" ON portfolio_items;
CREATE POLICY "Anyone can view portfolio items"
  ON portfolio_items FOR SELECT USING (is_public = true);

DROP POLICY IF EXISTS "Artists can manage their own portfolio" ON portfolio_items;
CREATE POLICY "Artists can manage their own portfolio"
  ON portfolio_items FOR ALL USING (auth.uid() = artist_id);

-- ============================================
-- Artist Instagram Tokens
-- ============================================

ALTER TABLE artist_instagram_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Artists can manage their own instagram tokens" ON artist_instagram_tokens;
CREATE POLICY "Artists can manage their own instagram tokens"
  ON artist_instagram_tokens FOR ALL USING (auth.uid() = artist_id);
