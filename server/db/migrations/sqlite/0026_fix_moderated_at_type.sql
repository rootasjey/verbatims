-- Fix moderated_at type inconsistency
-- Admin endpoints used sql`CURRENT_TIMESTAMP` (TEXT) while v1 API used new Date() (INTEGER)
-- This caused ORDER BY q.moderated_at DESC to sort TEXT values before INTEGER in SQLite,
-- pushing v1-approved quotes (INTEGER) after all admin-approved quotes (TEXT) regardless of date.

UPDATE quotes
SET moderated_at = CAST(strftime('%s', moderated_at) AS INTEGER)
WHERE TYPEOF(moderated_at) = 'text' AND moderated_at IS NOT NULL;
