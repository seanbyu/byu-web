-- ============================================
-- 99_seed.sql
-- 기본 데이터 시드
-- ============================================

-- Industries (업종)
INSERT INTO industries (name) VALUES
  ('HAIR'),
  ('NAIL'),
  ('ESTHETIC'),
  ('MASSAGE'),
  ('BARBERSHOP')
ON CONFLICT (name) DO NOTHING;

