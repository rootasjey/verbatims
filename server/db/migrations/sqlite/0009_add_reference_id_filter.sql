-- Add `reference_id` to the theme_content_filters type CHECK constraint
-- SQLite cannot ALTER a CHECK constraint, so we recreate the table.

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
