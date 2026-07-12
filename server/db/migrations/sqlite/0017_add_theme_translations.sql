CREATE TABLE IF NOT EXISTS theme_translations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  theme_id INTEGER NOT NULL REFERENCES themes(id) ON DELETE CASCADE,
  language TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  UNIQUE(theme_id, language)
);

CREATE INDEX IF NOT EXISTS idx_theme_translations_theme ON theme_translations(theme_id);
CREATE INDEX IF NOT EXISTS idx_theme_translations_language ON theme_translations(language);

ALTER TABLE themes DROP COLUMN name_i18n;
ALTER TABLE themes DROP COLUMN description_i18n;
