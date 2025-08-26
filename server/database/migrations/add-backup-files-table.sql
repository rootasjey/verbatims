-- Migration: Add backup_files table for R2 storage integration
-- Created: 2025-01-15
-- Description: Adds backup_files table to track files stored in Cloudflare R2 via NuxtHub blob storage

-- Create backup_files table
CREATE TABLE IF NOT EXISTS backup_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_key TEXT NOT NULL UNIQUE,           -- R2 object key (unique identifier)
  export_log_id INTEGER,                   -- Link to export_logs (optional for standalone backups)
  filename TEXT NOT NULL,                  -- Original filename
  file_path TEXT NOT NULL,                 -- Full R2 path (archives/YYYY-MM-DD/filename)
  file_size INTEGER,                       -- File size in bytes
  compressed_size INTEGER,                 -- Compressed size if gzipped
  content_hash TEXT,                       -- SHA-256 hash for integrity verification
  compression_type TEXT DEFAULT 'none',   -- 'none', 'gzip'
  storage_status TEXT DEFAULT 'uploading' CHECK (storage_status IN ('uploading', 'stored', 'failed', 'expired')),
  retention_days INTEGER DEFAULT 90,      -- Retention period in days
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  uploaded_at DATETIME,                    -- When upload completed
  expires_at DATETIME,                     -- Calculated expiration date
  last_accessed_at DATETIME,              -- Track access for analytics
  access_count INTEGER DEFAULT 0,         -- Download count
  metadata TEXT,                           -- JSON metadata (export config, etc.)
  FOREIGN KEY (export_log_id) REFERENCES export_logs(id) ON DELETE CASCADE
);

-- Create indexes for backup_files table
CREATE INDEX IF NOT EXISTS idx_backup_files_file_key ON backup_files(file_key);
CREATE INDEX IF NOT EXISTS idx_backup_files_export_log ON backup_files(export_log_id);
CREATE INDEX IF NOT EXISTS idx_backup_files_status ON backup_files(storage_status);
CREATE INDEX IF NOT EXISTS idx_backup_files_created ON backup_files(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_backup_files_expires ON backup_files(expires_at);
CREATE INDEX IF NOT EXISTS idx_backup_files_path ON backup_files(file_path);

-- Update export_logs table to extend retention for backup-enabled exports
-- (Optional: Extend default expiration for exports that have backup files)
-- This can be handled in application logic instead of schema changes
