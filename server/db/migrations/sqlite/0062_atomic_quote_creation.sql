CREATE TABLE quote_creation_requests (
  request_key TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  author_id INTEGER,
  reference_id INTEGER,
  quote_id INTEGER REFERENCES quotes(id) ON DELETE SET NULL,
  primary_attribution_id INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
