CREATE TABLE IF NOT EXISTS theme_enrichment_jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  theme_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  payload TEXT DEFAULT '{}',
  result TEXT,
  created_by INTEGER,
  created_at INTEGER DEFAULT (CAST(unixepoch() AS INTEGER)),
  processed_at INTEGER,
  FOREIGN KEY (theme_id) REFERENCES themes(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_theme_enrichment_jobs_theme_status
  ON theme_enrichment_jobs(theme_id, status);

CREATE INDEX IF NOT EXISTS idx_theme_enrichment_jobs_status_order
  ON theme_enrichment_jobs(status, created_at);
