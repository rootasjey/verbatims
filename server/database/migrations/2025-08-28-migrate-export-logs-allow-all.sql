-- Migration: Allow 'all' in export_logs.data_type
-- Date: 2025-08-28
-- Purpose: SQLite cannot alter CHECK constraints in-place. We recreate export_logs
--          with an updated CHECK to include 'all' and migrate existing data.

PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;

-- Create new table with the updated CHECK constraint
CREATE TABLE IF NOT EXISTS export_logs_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  export_id TEXT NOT NULL UNIQUE,
  filename TEXT NOT NULL,
  format TEXT NOT NULL,
  data_type TEXT NOT NULL CHECK (data_type IN ('quotes', 'references', 'authors', 'users', 'all')),
  filters_applied TEXT,
  record_count INTEGER,
  file_size INTEGER,
  user_id INTEGER,
  include_relations BOOLEAN DEFAULT FALSE,
  include_metadata BOOLEAN DEFAULT FALSE,
  download_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME DEFAULT (datetime('now', '+24 hours')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Migrate existing data
INSERT INTO export_logs_new (
  id, export_id, filename, format, data_type, filters_applied, record_count, file_size, user_id,
  include_relations, include_metadata, download_count, created_at, expires_at
)
SELECT
  id, export_id, filename, format, data_type, filters_applied, record_count, file_size, user_id,
  include_relations, include_metadata, download_count, created_at, expires_at
FROM export_logs;

-- Drop indexes bound to the old table (if any)
DROP INDEX IF EXISTS idx_export_logs_export_id;
DROP INDEX IF EXISTS idx_export_logs_user;
DROP INDEX IF EXISTS idx_export_logs_data_type;
DROP INDEX IF EXISTS idx_export_logs_created;
DROP INDEX IF EXISTS idx_export_logs_expires;

-- Replace old table
DROP TABLE export_logs;
ALTER TABLE export_logs_new RENAME TO export_logs;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_export_logs_export_id ON export_logs(export_id);
CREATE INDEX IF NOT EXISTS idx_export_logs_user ON export_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_export_logs_data_type ON export_logs(data_type);
CREATE INDEX IF NOT EXISTS idx_export_logs_created ON export_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_export_logs_expires ON export_logs(expires_at);

COMMIT;
PRAGMA foreign_keys=ON;
