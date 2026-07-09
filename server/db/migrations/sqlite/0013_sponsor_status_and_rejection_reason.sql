-- Replace is_active (boolean) with explicit status enum + add rejection_reason
-- SQLite DROP COLUMN is supported from 3.35.0 (D1 uses a modern version).

ALTER TABLE sponsor_messages ADD COLUMN status TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE sponsor_messages ADD COLUMN rejection_reason TEXT;

UPDATE sponsor_messages SET status = 'approved' WHERE is_active = 1;
UPDATE sponsor_messages SET status = 'pending' WHERE is_active = 0;

DROP INDEX IF EXISTS idx_sponsor_messages_active;
ALTER TABLE sponsor_messages DROP COLUMN is_active;

CREATE INDEX IF NOT EXISTS idx_sponsor_messages_status ON sponsor_messages(status);
