-- Backfill activity_logs with quote names for existing entries
-- The logActivity() calls previously didn't include the quote name in metadata,
-- so the admin dashboard showed "root approved quote" without the quote text.

UPDATE activity_logs
SET metadata = json_set(metadata, '$.name', (SELECT name FROM quotes WHERE id = target_id))
WHERE type IN ('quote_created', 'quote_submitted', 'quote_moderated')
  AND target_type = 'quote'
  AND target_id IS NOT NULL
  AND json_extract(metadata, '$.name') IS NULL;
