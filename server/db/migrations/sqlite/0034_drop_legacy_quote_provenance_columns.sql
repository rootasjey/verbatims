-- Legacy provenance now lives exclusively in quote_attributions and quote_sources.
-- SQLite cannot drop columns that are part of a foreign-key definition, so rebuild
-- quotes without the deprecated fields while preserving its data and dependent rows.
-- Stop before any schema change if the normalized data is not ready to stand alone.
CREATE TABLE quote_provenance_preflight (
  valid INTEGER NOT NULL CHECK (valid = 1)
);

INSERT INTO quote_provenance_preflight (valid)
SELECT CASE WHEN
  EXISTS (
    SELECT 1 FROM quotes q
    WHERE NOT EXISTS (SELECT 1 FROM quote_attributions qa WHERE qa.quote_id = q.id)
  )
  OR EXISTS (
    SELECT 1 FROM quote_attributions
    WHERE author_id IS NULL AND reference_id IS NULL
  )
  OR EXISTS (
    SELECT 1 FROM quotes q
    WHERE (SELECT COUNT(*) FROM quote_attributions qa WHERE qa.quote_id = q.id AND qa.is_primary = TRUE) != 1
  )
  OR EXISTS (
    SELECT 1 FROM quote_sources qs
    WHERE NOT EXISTS (
      SELECT 1 FROM quote_attributions qa
      WHERE qa.id = qs.attribution_id AND qa.quote_id = qs.quote_id
    )
  )
  OR EXISTS (
    SELECT 1 FROM quote_sources qs
    WHERE qs.is_primary = TRUE
      AND qs.id NOT IN (
        SELECT MIN(id) FROM quote_sources WHERE is_primary = TRUE GROUP BY quote_id
      )
  )
THEN 0 ELSE 1 END;

DROP TABLE quote_provenance_preflight;

PRAGMA foreign_keys = OFF;

DROP TABLE IF EXISTS quotes_new;
DROP TRIGGER IF EXISTS quotes_fts_ai;
DROP TRIGGER IF EXISTS quotes_fts_ad;
DROP TRIGGER IF EXISTS quotes_fts_au;
DROP TRIGGER IF EXISTS update_quotes_timestamp;
DROP TRIGGER IF EXISTS increment_quote_views;
DROP TRIGGER IF EXISTS increment_likes_count;
DROP TRIGGER IF EXISTS decrement_likes_count;
DROP TABLE IF EXISTS quotes_fts;

CREATE TABLE quotes_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  language TEXT DEFAULT 'en' CHECK (language IN ('en', 'fr', 'es', 'de', 'it', 'pt', 'ru', 'ja', 'zh', 'la')),
  user_id INTEGER NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('harvested', 'draft', 'pending', 'approved', 'rejected')),
  moderator_id INTEGER,
  moderated_at DATETIME,
  rejection_reason TEXT,
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (moderator_id) REFERENCES users(id)
);

INSERT INTO quotes_new (
  id, name, language, user_id, status, moderator_id, moderated_at,
  rejection_reason, views_count, likes_count, shares_count, is_featured,
  created_at, updated_at
)
SELECT
  id, name, language, user_id, status, moderator_id, moderated_at,
  rejection_reason, views_count, likes_count, shares_count, is_featured,
  created_at, updated_at
FROM quotes;

DROP TABLE quotes;
ALTER TABLE quotes_new RENAME TO quotes;

CREATE INDEX idx_quotes_status ON quotes(status);
CREATE INDEX idx_quotes_user ON quotes(user_id);
CREATE INDEX idx_quotes_created ON quotes(created_at DESC);
CREATE INDEX idx_quotes_featured ON quotes(is_featured);
CREATE INDEX idx_quotes_language ON quotes(language);

CREATE VIRTUAL TABLE quotes_fts USING fts5(
  name,
  content=quotes,
  content_rowid=id,
  tokenize='porter unicode61'
);

CREATE TRIGGER quotes_fts_ai AFTER INSERT ON quotes BEGIN
  INSERT INTO quotes_fts(rowid, name) VALUES (new.id, new.name);
END;

CREATE TRIGGER quotes_fts_ad AFTER DELETE ON quotes BEGIN
  INSERT INTO quotes_fts(quotes_fts, rowid, name) VALUES('delete', old.id, old.name);
END;

CREATE TRIGGER quotes_fts_au AFTER UPDATE ON quotes BEGIN
  INSERT INTO quotes_fts(quotes_fts, rowid, name) VALUES('delete', old.id, old.name);
  INSERT INTO quotes_fts(rowid, name) VALUES (new.id, new.name);
END;

INSERT INTO quotes_fts(quotes_fts) VALUES('rebuild');

CREATE TRIGGER update_quotes_timestamp
AFTER UPDATE ON quotes
FOR EACH ROW
BEGIN
  UPDATE quotes SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

CREATE TRIGGER increment_quote_views
AFTER INSERT ON quote_views
FOR EACH ROW
BEGIN
  UPDATE quotes SET views_count = views_count + 1 WHERE id = NEW.quote_id;
END;

CREATE TRIGGER increment_likes_count
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

CREATE TRIGGER decrement_likes_count
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
