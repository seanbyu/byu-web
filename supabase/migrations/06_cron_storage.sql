-- ============================================
-- 06_cron_storage.sql
-- Storage 버킷 + Realtime + pg_cron 작업
-- ============================================

-- ============================================
-- Storage: avatars 버킷
-- ============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Authenticated users can upload avatars"   ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update avatars"   ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete avatars"   ON storage.objects;
DROP POLICY IF EXISTS "Public can view avatars"                  ON storage.objects;

CREATE POLICY "Authenticated users can upload avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update avatars"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete avatars"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Public can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- ============================================
-- Realtime: notifications 테이블 활성화
-- ============================================

ALTER TABLE notifications REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  END IF;
END $$;

-- ============================================
-- pg_cron: 확장 활성화
-- ============================================

CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================
-- pg_cron: 오래된 알림 자동 삭제 (매일 03:00 UTC)
-- ============================================

SELECT cron.unschedule('delete-old-notifications')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'delete-old-notifications');

SELECT cron.schedule(
  'delete-old-notifications',
  '0 3 * * *',
  'SELECT delete_old_notifications()'
);

-- ============================================
-- pg_cron: 예약 당일 리마인더 큐잉 (매일 02:00 UTC = 09:00 ICT)
-- ============================================

SELECT cron.unschedule('queue-booking-reminders')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'queue-booking-reminders');

SELECT cron.schedule(
  'queue-booking-reminders',
  '0 2 * * *',
  'SELECT queue_booking_reminders()'
);
