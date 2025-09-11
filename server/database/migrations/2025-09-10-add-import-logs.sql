-- Migration: Add import_logs table for admin imports

CREATE TABLE IF NOT EXISTS import_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  import_id TEXT NOT NULL UNIQUE,
  filename TEXT,
  format TEXT NOT NULL,
  data_type TEXT NOT NULL CHECK (data_type IN ('all', 'authors', 'quotes', 'references', 'tags', 'users')),
  record_count INTEGER,
  successful_count INTEGER,
  failed_count INTEGER,
  warnings_count INTEGER,
  user_id INTEGER,
  options TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending','processing','completed','failed')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_import_logs_import_id ON import_logs(import_id);
CREATE INDEX IF NOT EXISTS idx_import_logs_status ON import_logs(status);
CREATE INDEX IF NOT EXISTS idx_import_logs_created ON import_logs(created_at DESC);

