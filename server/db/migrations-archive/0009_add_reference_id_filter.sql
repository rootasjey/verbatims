-- Add `reference_id` to the theme_content_filters type CHECK constraint
-- SQLite cannot ALTER a CHECK constraint, so we recreate the table.
--
-- First, create the parent table if it does not exist yet (e.g. on databases
-- that were migrated from the initial schema but never had these tables).
-- This ensures the FK reference and subsequent INSERT/SELECT/DROP are safe.

CREATE TABLE IF NOT EXISTS themes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  config TEXT DEFAULT '{}',
  is_active INTEGER DEFAULT 0,
  is_default INTEGER DEFAULT 0,
  scheduled_date TEXT,
  scheduled_start INTEGER,
  scheduled_end INTEGER,
  priority INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT CURRENT_TIMESTAMP,
  updated_at INTEGER DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_themes_slug ON themes(slug);
CREATE INDEX IF NOT EXISTS idx_themes_active ON themes(is_active);
CREATE INDEX IF NOT EXISTS idx_themes_default ON themes(is_default);
CREATE INDEX IF NOT EXISTS idx_themes_scheduled ON themes(scheduled_date);

CREATE TABLE IF NOT EXISTS theme_content_filters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  theme_id INTEGER NOT NULL REFERENCES themes(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('keyword', 'tag_name', 'author_name', 'reference_name', 'author_id')),
  value TEXT NOT NULL,
  match_mode TEXT DEFAULT 'any' CHECK (match_mode IN ('any', 'all'))
);

DROP INDEX IF EXISTS idx_theme_filters_theme;

CREATE TABLE IF NOT EXISTS theme_content_filters_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  theme_id INTEGER NOT NULL REFERENCES themes(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('keyword', 'tag_name', 'author_name', 'reference_name', 'author_id', 'reference_id')),
  value TEXT NOT NULL,
  match_mode TEXT DEFAULT 'any' CHECK (match_mode IN ('any', 'all'))
);

INSERT INTO theme_content_filters_new SELECT * FROM theme_content_filters;

DROP TABLE theme_content_filters;

ALTER TABLE theme_content_filters_new RENAME TO theme_content_filters;

CREATE INDEX IF NOT EXISTS idx_theme_filters_theme ON theme_content_filters(theme_id);
