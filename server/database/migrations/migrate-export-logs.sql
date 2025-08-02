-- Migration script to unify export logs tables
-- This script migrates data from separate quotes_export_logs and references_export_logs
-- tables to a unified export_logs table with data_type categorization

-- Create the new unified export_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS export_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  export_id TEXT NOT NULL UNIQUE,
  filename TEXT NOT NULL,
  format TEXT NOT NULL,
  data_type TEXT NOT NULL CHECK (data_type IN ('quotes', 'references', 'authors', 'users')),
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

-- Migrate data from quotes_export_logs if it exists
INSERT OR IGNORE INTO export_logs (
  export_id, filename, format, data_type, filters_applied, record_count, 
  file_size, user_id, include_relations, include_metadata, download_count, 
  created_at, expires_at
)
SELECT 
  export_id, 
  filename, 
  format, 
  'quotes' as data_type,
  filters_applied, 
  record_count, 
  file_size, 
  user_id, 
  FALSE as include_relations,  -- Default value for old records
  FALSE as include_metadata,   -- Default value for old records
  download_count, 
  created_at, 
  expires_at
FROM quotes_export_logs 
WHERE EXISTS (SELECT name FROM sqlite_master WHERE type='table' AND name='quotes_export_logs');

-- Migrate data from references_export_logs if it exists
INSERT OR IGNORE INTO export_logs (
  export_id, filename, format, data_type, filters_applied, record_count, 
  file_size, user_id, include_relations, include_metadata, download_count, 
  created_at, expires_at
)
SELECT 
  export_id, 
  filename, 
  format, 
  'references' as data_type,
  filters as filters_applied,  -- Note: column name difference
  record_count, 
  NULL as file_size,           -- references_export_logs doesn't have file_size
  user_id, 
  include_relations, 
  include_metadata, 
  download_count, 
  created_at, 
  expires_at
FROM references_export_logs 
WHERE EXISTS (SELECT name FROM sqlite_master WHERE type='table' AND name='references_export_logs');

-- Create indexes for the new table
CREATE INDEX IF NOT EXISTS idx_export_logs_export_id ON export_logs(export_id);
CREATE INDEX IF NOT EXISTS idx_export_logs_user ON export_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_export_logs_data_type ON export_logs(data_type);
CREATE INDEX IF NOT EXISTS idx_export_logs_created ON export_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_export_logs_expires ON export_logs(expires_at);

-- Optional: Drop old tables after successful migration
-- Uncomment these lines after verifying the migration was successful
-- DROP TABLE IF EXISTS quotes_export_logs;
-- DROP TABLE IF EXISTS references_export_logs;
