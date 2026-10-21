CREATE TABLE IF NOT EXISTS author_translations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  author_id INTEGER NOT NULL REFERENCES authors(id) ON DELETE CASCADE,
  language TEXT NOT NULL,
  job TEXT,
  description TEXT,
  UNIQUE(author_id, language)
);

CREATE INDEX IF NOT EXISTS idx_author_translations_author ON author_translations(author_id);

CREATE TABLE IF NOT EXISTS reference_translations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference_id INTEGER NOT NULL REFERENCES quote_references(id) ON DELETE CASCADE,
  language TEXT NOT NULL,
  name TEXT,
  description TEXT,
  UNIQUE(reference_id, language)
);

CREATE INDEX IF NOT EXISTS idx_reference_translations_reference ON reference_translations(reference_id);
