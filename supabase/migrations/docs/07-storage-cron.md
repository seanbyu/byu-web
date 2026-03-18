# Storage & Cron

> 파일: `06_cron_storage.sql`

---

## Storage 버킷

### `avatars` (public)
유저 프로필 이미지 저장.

| 작업 | 권한 |
|------|------|
| 조회 (SELECT) | 모두 (public) |
| 업로드 (INSERT) | 인증 유저 |
| 수정 (UPDATE) | 인증 유저 |
| 삭제 (DELETE) | 인증 유저 |

### `salon-images` (public)
살롱 이미지 저장.

**경로 구조:**
```
salon-images/
  └── {salonId}/
        ├── cover/image.jpg   ← 커버 이미지
        ├── logo/image.jpg    ← 로고
        └── gallery/          ← 갤러리
```

> `salon-images` 버킷 정책은 Supabase Dashboard에서 직접 설정 필요.

---

## Realtime

`notifications` 테이블에 Realtime 활성화:
```sql
ALTER TABLE notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
```

---

## pg_cron 작업

| 작업명 | 스케줄 | 설명 |
|--------|--------|------|
| `delete-old-notifications` | `0 3 * * *` (03:00 UTC) | 1일 이상 지난 알림 자동 삭제 |
| `queue-booking-reminders` | `0 2 * * *` (02:00 UTC = 09:00 ICT) | 오늘 예약 LINE 리마인더 큐잉 |
