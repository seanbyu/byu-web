-- ============================================
-- Add google_maps_url to salons table
-- ============================================
ALTER TABLE salons
  ADD COLUMN IF NOT EXISTS google_maps_url TEXT;

COMMENT ON COLUMN salons.google_maps_url IS 'Full Google Maps place URL for external link and location reference';
