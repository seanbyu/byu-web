-- ============================================
-- 07_email_verifications.sql
-- 이메일 OTP 인증 임시 저장 테이블
-- ============================================

CREATE TABLE IF NOT EXISTS email_verifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT NOT NULL,
  code       TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_verifications_email ON email_verifications(email, expires_at);

-- 만료된 레코드 자동 정리 (1시간 이상 지난 것)
CREATE OR REPLACE FUNCTION cleanup_email_verifications()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  DELETE FROM email_verifications WHERE expires_at < NOW() - INTERVAL '1 hour';
END;
$$;

-- RLS 비활성화 (Edge Function이 service_role로만 접근)
ALTER TABLE email_verifications DISABLE ROW LEVEL SECURITY;
