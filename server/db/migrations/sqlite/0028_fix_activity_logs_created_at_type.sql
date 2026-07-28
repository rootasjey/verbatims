-- Fix activity_logs.created_at type inconsistency
-- Migration 0025 backfilled quote_moderated entries using moderated_at as created_at,
-- which was stored as TEXT (from sql`CURRENT_TIMESTAMP`). Convert to INTEGER unix timestamps.

UPDATE activity_logs
SET created_at = CAST(strftime('%s', created_at) AS INTEGER)
WHERE TYPEOF(created_at) = 'text' AND created_at IS NOT NULL;
