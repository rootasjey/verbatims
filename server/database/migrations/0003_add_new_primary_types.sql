-- Add new primary types: media_stream, writings, video_game
-- This migration updates the CHECK constraint for the primary_type column
-- to include the new categories for better quote reference categorization

-- SQLite doesn't support ALTER COLUMN directly, so we need to:
-- 1. Create a new table with the updated constraint
-- 2. Copy data from the old table
-- 3. Drop the old table
-- 4. Rename the new table

BEGIN TRANSACTION;

-- Create new table with updated primary_type constraint
CREATE TABLE IF NOT EXISTS quote_references_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL CHECK (length(name) >= 2 AND length(name) <= 200),
  original_language TEXT DEFAULT 'en',
  release_date DATE,
  description TEXT,
  primary_type TEXT NOT NULL CHECK (primary_type IN ('film', 'book', 'tv_series', 'music', 'speech', 'podcast', 'interview', 'documentary', 'media_stream', 'writings', 'video_game', 'other')),
  secondary_type TEXT,
  image_url TEXT,
  urls TEXT DEFAULT '[]' CHECK (json_valid(urls)),
  imdb_id TEXT,
  isbn TEXT,
  spotify_id TEXT,
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Copy all data from the old table to the new table
INSERT INTO quote_references_new (
  id, name, original_language, release_date, description, primary_type, 
  secondary_type, image_url, urls, imdb_id, isbn, spotify_id, 
  views_count, likes_count, shares_count, created_at, updated_at
)
SELECT 
  id, name, original_language, release_date, description, primary_type, 
  secondary_type, image_url, urls, imdb_id, isbn, spotify_id, 
  views_count, likes_count, shares_count, created_at, updated_at
FROM quote_references;

-- Drop the old table
DROP TABLE quote_references;

-- Rename the new table to the original name
ALTER TABLE quote_references_new RENAME TO quote_references;

-- Recreate the index for primary_type
CREATE INDEX IF NOT EXISTS idx_references_type ON quote_references(primary_type);

-- Recreate other indexes that were dropped
CREATE INDEX IF NOT EXISTS idx_references_imdb ON quote_references(imdb_id);
CREATE INDEX IF NOT EXISTS idx_references_isbn ON quote_references(isbn);

-- Recreate the trigger for updated_at timestamps
CREATE TRIGGER IF NOT EXISTS update_references_timestamp
AFTER UPDATE ON quote_references
FOR EACH ROW
BEGIN
  UPDATE quote_references SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

-- Recreate the trigger for maintaining likes count
CREATE TRIGGER IF NOT EXISTS increment_likes_count_references
AFTER INSERT ON user_likes
FOR EACH ROW
WHEN NEW.likeable_type = 'reference'
BEGIN
  UPDATE quote_references SET likes_count = likes_count + 1 WHERE id = NEW.likeable_id;
END;

CREATE TRIGGER IF NOT EXISTS decrement_likes_count_references
AFTER DELETE ON user_likes
FOR EACH ROW
WHEN OLD.likeable_type = 'reference'
BEGIN
  UPDATE quote_references SET likes_count = likes_count - 1 WHERE id = OLD.likeable_id;
END;

COMMIT;
