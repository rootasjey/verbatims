ALTER TABLE authors ADD COLUMN image_alt TEXT;
ALTER TABLE authors ADD COLUMN image_credit TEXT;
ALTER TABLE authors ADD COLUMN image_source_url TEXT;
ALTER TABLE authors ADD COLUMN image_license TEXT;
ALTER TABLE authors ADD COLUMN image_date TEXT;
ALTER TABLE authors ADD COLUMN image_location TEXT;

ALTER TABLE quote_references ADD COLUMN image_alt TEXT;
ALTER TABLE quote_references ADD COLUMN image_credit TEXT;
ALTER TABLE quote_references ADD COLUMN image_source_url TEXT;
ALTER TABLE quote_references ADD COLUMN image_license TEXT;
ALTER TABLE quote_references ADD COLUMN image_date TEXT;
ALTER TABLE quote_references ADD COLUMN image_location TEXT;
