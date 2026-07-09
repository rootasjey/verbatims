-- Repair references rewritten to quotes_old during quotes table rebuild.
-- SQLite table renames can rewrite dependent FK and trigger SQL, leaving stale refs.

PRAGMA foreign_keys=off;

DROP TRIGGER IF EXISTS increment_quote_views;
DROP TRIGGER IF EXISTS increment_likes_count;
DROP TRIGGER IF EXISTS decrement_likes_count;

ALTER TABLE quote_tags RENAME TO quote_tags_old;
CREATE TABLE quote_tags (
  quote_id INTEGER,
  tag_id INTEGER,
  PRIMARY KEY (quote_id, tag_id),
  FOREIGN KEY (quote_id) REFERENCES quotes(id) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON UPDATE no action ON DELETE cascade
);
INSERT INTO quote_tags (quote_id, tag_id)
SELECT quote_id, tag_id FROM quote_tags_old;
DROP TABLE quote_tags_old;

ALTER TABLE collection_quotes RENAME TO collection_quotes_old;
CREATE TABLE collection_quotes (
  collection_id INTEGER,
  quote_id INTEGER,
  added_at INTEGER DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (collection_id, quote_id),
  FOREIGN KEY (collection_id) REFERENCES user_collections(id) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (quote_id) REFERENCES quotes(id) ON UPDATE no action ON DELETE cascade
);
INSERT INTO collection_quotes (collection_id, quote_id, added_at)
SELECT collection_id, quote_id, added_at FROM collection_quotes_old;
DROP TABLE collection_quotes_old;

ALTER TABLE quote_reports RENAME TO quote_reports_old;
CREATE TABLE quote_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  quote_id INTEGER NOT NULL,
  reporter_id INTEGER NOT NULL,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  reviewed_by INTEGER,
  reviewed_at INTEGER,
  created_at INTEGER DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (quote_id) REFERENCES quotes(id) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (reporter_id) REFERENCES users(id) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON UPDATE no action ON DELETE no action
);
INSERT INTO quote_reports (id, quote_id, reporter_id, reason, description, status, reviewed_by, reviewed_at, created_at)
SELECT id, quote_id, reporter_id, reason, description, status, reviewed_by, reviewed_at, created_at
FROM quote_reports_old;
DROP TABLE quote_reports_old;
CREATE INDEX IF NOT EXISTS idx_quote_reports_status ON quote_reports (status);

ALTER TABLE quote_views RENAME TO quote_views_old;
CREATE TABLE quote_views (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  quote_id INTEGER NOT NULL,
  user_id INTEGER,
  ip_address TEXT,
  user_agent TEXT,
  viewed_at INTEGER DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (quote_id) REFERENCES quotes(id) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE no action ON DELETE set null
);
INSERT INTO quote_views (id, quote_id, user_id, ip_address, user_agent, viewed_at)
SELECT id, quote_id, user_id, ip_address, user_agent, viewed_at
FROM quote_views_old;
DROP TABLE quote_views_old;
CREATE INDEX IF NOT EXISTS idx_quote_views_quote ON quote_views (quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_views_user ON quote_views (user_id);
CREATE INDEX IF NOT EXISTS idx_quote_views_date ON quote_views (viewed_at);

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

PRAGMA foreign_keys=on;
