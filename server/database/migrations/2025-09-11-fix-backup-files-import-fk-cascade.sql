-- Migration: 2025-09-11 - Fix backup_files import_log_id FK to ON DELETE CASCADE
-- Purpose: Rebuild the `backup_files` table to make the foreign key on
-- `import_log_id` use ON DELETE CASCADE (so backup_files are removed when an
-- import_log is deleted). SQLite requires table rebuilds to change FK
-- constraints.
--
-- IMPORTANT:
-- - This migration assumes the `import_log_id` column already exists in
--   `backup_files` (it was added by `2025-09-10-add-import-log-id-to-backup-files.sql`).
--   If that earlier migration has NOT been applied yet, run it first, or
--   instead run the alternate combined steps shown at the bottom of this
--   file (COMMENT/UNCOMMENT as appropriate).
-- - Always backup your database before running this migration.
-- - The script temporarily disables foreign keys while rebuilding the table.

PRAGMA foreign_keys=OFF;

-- Create a new table with the desired FK behaviours
CREATE TABLE IF NOT EXISTS backup_files_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_key TEXT NOT NULL UNIQUE,
  export_log_id INTEGER,
  import_log_id INTEGER,
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  compressed_size INTEGER,
  content_hash TEXT,
  compression_type TEXT DEFAULT 'none',
  storage_status TEXT DEFAULT 'uploading' CHECK (storage_status IN ('uploading', 'stored', 'failed', 'expired')),
  retention_days INTEGER DEFAULT 90,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  uploaded_at DATETIME,
  expires_at DATETIME,
  last_accessed_at DATETIME,
  access_count INTEGER DEFAULT 0,
  metadata TEXT,
  FOREIGN KEY (export_log_id) REFERENCES export_logs(id) ON DELETE CASCADE,
  FOREIGN KEY (import_log_id) REFERENCES import_logs(id) ON DELETE CASCADE
);

-- Copy data from the existing table into the new table.
-- This SELECT assumes the existing `backup_files` table already has an
-- `import_log_id` column. If it does not, run the earlier migration that adds
-- the column first (2025-09-10-add-import-log-id-to-backup-files.sql), or use
-- the alternate combined steps at the end of this file.
INSERT INTO backup_files_new (
  id, file_key, export_log_id, import_log_id, filename, file_path,
  file_size, compressed_size, content_hash, compression_type, storage_status,
  retention_days, created_at, uploaded_at, expires_at, last_accessed_at,
  access_count, metadata
)
SELECT
  id, file_key, export_log_id, import_log_id, filename, file_path,
  file_size, compressed_size, content_hash, compression_type, storage_status,
  retention_days, created_at, uploaded_at, expires_at, last_accessed_at,
  access_count, metadata
FROM backup_files;

-- Drop the old table and replace it with the new one
DROP TABLE backup_files;
ALTER TABLE backup_files_new RENAME TO backup_files;

-- Recreate indexes used by application (kept in sync with schema.sql)
CREATE INDEX IF NOT EXISTS idx_backup_files_import_log ON backup_files(import_log_id);
CREATE INDEX IF NOT EXISTS idx_backup_files_file_key ON backup_files(file_key);
CREATE INDEX IF NOT EXISTS idx_backup_files_export_log ON backup_files(export_log_id);
CREATE INDEX IF NOT EXISTS idx_backup_files_status ON backup_files(storage_status);
CREATE INDEX IF NOT EXISTS idx_backup_files_created ON backup_files(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_backup_files_expires ON backup_files(expires_at);
CREATE INDEX IF NOT EXISTS idx_backup_files_path ON backup_files(file_path);

COMMIT;
PRAGMA foreign_keys=ON;

-- ===========================================================================
-- Alternate combined path (use only if you need to both add the column and
-- rebuild in one migration). If the earlier migration that adds the column
-- (2025-09-10-...) has NOT been applied anywhere and you want to run a single
-- migration, comment out the above block and uncomment the block below.
-- NOTE: Do NOT leave both the above and below blocks enabled; they conflict.
-- ===========================================================================
--
-- PRAGMA foreign_keys=OFF;
--
-- -- Add the column if it doesn't exist. If it already exists this statement
-- -- will fail; use this combined migration only in fresh DBs where the
-- -- import_log_id column is not present.
-- ALTER TABLE backup_files ADD COLUMN import_log_id INTEGER;
--
-- -- Now rebuild the table (same as above)
-- CREATE TABLE IF NOT EXISTS backup_files_new (
--   id INTEGER PRIMARY KEY AUTOINCREMENT,
--   file_key TEXT NOT NULL UNIQUE,
--   export_log_id INTEGER,
--   import_log_id INTEGER,
--   filename TEXT NOT NULL,
--   file_path TEXT NOT NULL,
--   file_size INTEGER,
--   compressed_size INTEGER,
--   content_hash TEXT,
--   compression_type TEXT DEFAULT 'none',
--   storage_status TEXT DEFAULT 'uploading' CHECK (storage_status IN ('uploading', 'stored', 'failed', 'expired')),
--   retention_days INTEGER DEFAULT 90,
--   created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
--   uploaded_at DATETIME,
--   expires_at DATETIME,
--   last_accessed_at DATETIME,
--   access_count INTEGER DEFAULT 0,
--   metadata TEXT,
--   FOREIGN KEY (export_log_id) REFERENCES export_logs(id) ON DELETE CASCADE,
--   FOREIGN KEY (import_log_id) REFERENCES import_logs(id) ON DELETE CASCADE
-- );
--
-- INSERT INTO backup_files_new (
--   id, file_key, export_log_id, import_log_id, filename, file_path,
--   file_size, compressed_size, content_hash, compression_type, storage_status,
--   retention_days, created_at, uploaded_at, expires_at, last_accessed_at,
--   access_count, metadata
-- )
-- SELECT
--   id, file_key, export_log_id, import_log_id, filename, file_path,
--   file_size, compressed_size, content_hash, compression_type, storage_status,
--   retention_days, created_at, uploaded_at, expires_at, last_accessed_at,
--   access_count, metadata
-- FROM backup_files;
--
-- DROP TABLE backup_files;
-- ALTER TABLE backup_files_new RENAME TO backup_files;
--
-- CREATE INDEX IF NOT EXISTS idx_backup_files_import_log ON backup_files(import_log_id);
-- CREATE INDEX IF NOT EXISTS idx_backup_files_file_key ON backup_files(file_key);
-- CREATE INDEX IF NOT EXISTS idx_backup_files_export_log ON backup_files(export_log_id);
-- CREATE INDEX IF NOT EXISTS idx_backup_files_status ON backup_files(storage_status);
-- CREATE INDEX IF NOT EXISTS idx_backup_files_created ON backup_files(created_at DESC);
-- CREATE INDEX IF NOT EXISTS idx_backup_files_expires ON backup_files(expires_at);
-- CREATE INDEX IF NOT EXISTS idx_backup_files_path ON backup_files(file_path);
--
-- COMMIT;
-- PRAGMA foreign_keys=ON;

-- End of migration
