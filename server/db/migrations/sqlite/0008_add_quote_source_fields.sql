ALTER TABLE quotes ADD COLUMN source_type TEXT;
ALTER TABLE quotes ADD COLUMN source_url TEXT;

CREATE INDEX IF NOT EXISTS idx_quotes_source_type ON quotes(source_type);
