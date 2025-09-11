-- Migration: Add import_log_id to backup_files and index
-- Note: SQLite (D1) cannot add a foreign key constraint via ALTER TABLE; schema.sql contains the FK for new setups.

ALTER TABLE backup_files ADD COLUMN import_log_id INTEGER;
CREATE INDEX IF NOT EXISTS idx_backup_files_import_log ON backup_files(import_log_id);
