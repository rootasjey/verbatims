-- source_type and source_url are now in the consolidated schema.sql.
-- This migration only creates the index; ALTER TABLE is handled by the base schema.
CREATE INDEX IF NOT EXISTS idx_quotes_source_type ON quotes(source_type);
