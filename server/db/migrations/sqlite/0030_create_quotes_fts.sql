-- FTS5 virtual table for full-text search on quotes
-- Uses external content from the quotes table (kept in sync via triggers)
-- NOTE: the FTS column MUST be named after the quotes column it indexes (`name`)
-- for the external-content association to work.
CREATE VIRTUAL TABLE IF NOT EXISTS quotes_fts USING fts5(
  name,
  content=quotes,
  content_rowid=id,
  tokenize='porter unicode61'
);

-- Triggers to keep FTS index in sync with quotes table

CREATE TRIGGER IF NOT EXISTS quotes_fts_ai AFTER INSERT ON quotes BEGIN
  INSERT INTO quotes_fts(rowid, name) VALUES (new.id, new.name);
END;

CREATE TRIGGER IF NOT EXISTS quotes_fts_ad AFTER DELETE ON quotes BEGIN
  INSERT INTO quotes_fts(quotes_fts, rowid, name) VALUES('delete', old.id, old.name);
END;

CREATE TRIGGER IF NOT EXISTS quotes_fts_au AFTER UPDATE ON quotes BEGIN
  INSERT INTO quotes_fts(quotes_fts, rowid, name) VALUES('delete', old.id, old.name);
  INSERT INTO quotes_fts(rowid, name) VALUES (new.id, new.name);
END;

-- Populate FTS index with existing quotes
INSERT INTO quotes_fts(quotes_fts) VALUES('rebuild');

