-- Migration: Add 'pending' status to quotes.status CHECK constraint
-- Environment: SQLite (Cloudflare D1)
-- Notes:
-- - SQLite doesn't support altering CHECK constraints in-place.
-- - We rebuild the quotes table with the widened CHECK, copy data, swap tables, then recreate indexes/triggers.
-- Important for Cloudflare D1: Do not use explicit SQL transactions here (BEGIN/COMMIT)
-- because they are blocked inside Durable Object contexts. Execute this file
-- as a single unit so PRAGMA applies across statements.

PRAGMA foreign_keys = OFF;

-- Ensure a clean slate for the temp table so this migration is idempotent
DROP TABLE IF EXISTS quotes_new;

-- 1) Create the new quotes table with the updated CHECK constraint
CREATE TABLE IF NOT EXISTS quotes_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  language TEXT DEFAULT 'en' CHECK (language IN ('en', 'fr', 'es', 'de', 'it', 'pt', 'ru', 'ja', 'zh')),
  author_id INTEGER,
  reference_id INTEGER,
  user_id INTEGER NOT NULL,
  -- Updated CHECK to include 'pending'
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'rejected')),
  moderator_id INTEGER,
  moderated_at DATETIME,
  rejection_reason TEXT,
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES authors(id),
  FOREIGN KEY (reference_id) REFERENCES quote_references(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (moderator_id) REFERENCES users(id)
);

-- 2) Copy data from old quotes table into the new one
-- Existing rows should already conform to the old CHECK; they also conform to the new, wider one.
INSERT INTO quotes_new (
  id, name, language, author_id, reference_id, user_id, status, moderator_id, moderated_at,
  rejection_reason, views_count, likes_count, shares_count, is_featured, created_at, updated_at
)
SELECT
  id, name, language, author_id, reference_id, user_id, status, moderator_id, moderated_at,
  rejection_reason, views_count, likes_count, shares_count, is_featured, created_at, updated_at
FROM quotes;

-- 3) Drop old quotes table and swap in the new one
-- Drop triggers that reference quotes so D1 doesn't error during the swap
DROP TRIGGER IF EXISTS update_quotes_timestamp;
DROP TRIGGER IF EXISTS increment_quote_views;
DROP TRIGGER IF EXISTS increment_likes_count;
DROP TRIGGER IF EXISTS decrement_likes_count;

DROP TABLE quotes;
ALTER TABLE quotes_new RENAME TO quotes;

-- 4) Recreate indexes on quotes
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_author ON quotes(author_id);
CREATE INDEX IF NOT EXISTS idx_quotes_reference ON quotes(reference_id);
CREATE INDEX IF NOT EXISTS idx_quotes_user ON quotes(user_id);
CREATE INDEX IF NOT EXISTS idx_quotes_created ON quotes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quotes_featured ON quotes(is_featured);
CREATE INDEX IF NOT EXISTS idx_quotes_language ON quotes(language);

-- 5) Recreate triggers bound to quotes (triggers on other tables remain intact)
CREATE TRIGGER IF NOT EXISTS update_quotes_timestamp
AFTER UPDATE ON quotes
FOR EACH ROW
BEGIN
  UPDATE quotes SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

-- Recreate polymorphic count-maintenance triggers that reference quotes
CREATE TRIGGER IF NOT EXISTS increment_quote_views
AFTER INSERT ON quote_views
FOR EACH ROW
BEGIN
  UPDATE quotes SET views_count = views_count + 1 WHERE id = NEW.quote_id;
END;

CREATE TRIGGER IF NOT EXISTS increment_likes_count
AFTER INSERT ON user_likes
FOR EACH ROW
BEGIN
  UPDATE quotes SET likes_count = likes_count + 1
  WHERE NEW.likeable_type = 'quote' AND id = NEW.likeable_id;

  UPDATE authors SET likes_count = likes_count + 1
  WHERE NEW.likeable_type = 'author' AND id = NEW.likeable_id;

  UPDATE quote_references SET likes_count = likes_count + 1
  WHERE NEW.likeable_type = 'reference' AND id = NEW.likeable_id;
END;

CREATE TRIGGER IF NOT EXISTS decrement_likes_count
AFTER DELETE ON user_likes
FOR EACH ROW
BEGIN
  UPDATE quotes SET likes_count = likes_count - 1
  WHERE OLD.likeable_type = 'quote' AND id = OLD.likeable_id;

  UPDATE authors SET likes_count = likes_count - 1
  WHERE OLD.likeable_type = 'author' AND id = OLD.likeable_id;

  UPDATE quote_references SET likes_count = likes_count - 1
  WHERE OLD.likeable_type = 'reference' AND id = OLD.likeable_id;
END;
PRAGMA foreign_keys = ON;

-- End of migration
