CREATE TABLE IF NOT EXISTS entity_suggestions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  theme_id INTEGER NOT NULL,
  enrichment_job_id INTEGER,
  type TEXT NOT NULL CHECK (type IN ('tag', 'author', 'reference')),
  suggested_value TEXT NOT NULL,
  context TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_by INTEGER,
  reviewed_by INTEGER,
  reviewed_at INTEGER,
  created_at INTEGER DEFAULT (CAST(unixepoch() AS INTEGER)),
  updated_at INTEGER DEFAULT (CAST(unixepoch() AS INTEGER)),
  FOREIGN KEY (theme_id) REFERENCES themes(id) ON DELETE CASCADE,
  FOREIGN KEY (enrichment_job_id) REFERENCES theme_enrichment_jobs(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_entity_suggestions_theme
  ON entity_suggestions(theme_id, status);

CREATE INDEX IF NOT EXISTS idx_entity_suggestions_status
  ON entity_suggestions(status, created_at);
