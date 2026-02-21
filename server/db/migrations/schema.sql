-- ============================================================================
-- VERBATIMS QUOTES APPLICATION - CONSOLIDATED DATABASE SCHEMA
-- ============================================================================
-- This file contains the complete database schema for the Verbatims quotes
-- application. It consolidates all previous migration files into a single
-- source of truth for database structure.
--
-- Generated: 2025-07-16
-- Consolidated through: 2025-09-11 (inclusive)
-- Database: SQLite (Cloudflare D1)
-- ============================================================================

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Users table (required for foreign keys)
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL CHECK (length(name) >= 1 AND length(name) <= 70),
  password TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin')),
  is_active BOOLEAN DEFAULT TRUE,
  email_verified BOOLEAN DEFAULT FALSE,
  biography TEXT,
  job TEXT,
  language TEXT DEFAULT 'en',
  location TEXT DEFAULT 'On Earth',
  socials TEXT DEFAULT '[]' CHECK (json_valid(socials)),
  last_login_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Authors table
CREATE TABLE IF NOT EXISTS authors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  is_fictional BOOLEAN DEFAULT FALSE,
  birth_date DATE,
  birth_location TEXT,
  death_date DATE,
  death_location TEXT,
  job TEXT,
  description TEXT,
  image_url TEXT,
  socials TEXT DEFAULT '[]' CHECK (json_valid(socials)),
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Quote references table (sources/works that quotes come from)
-- secondary_type: genre/category like 'horror', 'comedy', 'biography', etc.
CREATE TABLE IF NOT EXISTS quote_references (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  original_language TEXT DEFAULT 'en',
  release_date DATE,
  description TEXT,
  primary_type TEXT NOT NULL CHECK (primary_type IN ('film', 'book', 'tv_series', 'music', 'speech', 'podcast', 'interview', 'documentary', 'media_stream', 'writings', 'video_game', 'other')),
  secondary_type TEXT,
  image_url TEXT,
  urls TEXT DEFAULT '[]' CHECK (json_valid(urls)),
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Quotes table (main content table)
CREATE TABLE IF NOT EXISTS quotes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  language TEXT DEFAULT 'en' CHECK (language IN ('en', 'fr', 'es', 'de', 'it', 'pt', 'ru', 'ja', 'zh', 'la')),
  author_id INTEGER,
  reference_id INTEGER,
  user_id INTEGER NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'rejected')),
  moderator_id INTEGER,
  moderated_at DATETIME,
  rejection_reason TEXT,
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES authors(id),
  FOREIGN KEY (reference_id) REFERENCES quote_references(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (moderator_id) REFERENCES users(id)
);

-- ============================================================================
-- TAGGING SYSTEM
-- ============================================================================

-- Tags for categorizing quotes
CREATE TABLE IF NOT EXISTS tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT,
  color TEXT DEFAULT '#3B82F6',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Many-to-many relationship between quotes and tags
CREATE TABLE IF NOT EXISTS quote_tags (
  quote_id INTEGER,
  tag_id INTEGER,
  PRIMARY KEY (quote_id, tag_id),
  FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- ============================================================================
-- USER INTERACTIONS & COLLECTIONS
-- ============================================================================

-- User likes system (polymorphic - can like quotes, authors, or references)
CREATE TABLE IF NOT EXISTS user_likes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  likeable_type TEXT NOT NULL CHECK (likeable_type IN ('quote', 'author', 'reference')),
  likeable_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, likeable_type, likeable_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- User collections for organizing favorite quotes
CREATE TABLE IF NOT EXISTS user_collections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Many-to-many relationship between collections and quotes
CREATE TABLE IF NOT EXISTS collection_quotes (
  collection_id INTEGER,
  quote_id INTEGER,
  added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (collection_id, quote_id),
  FOREIGN KEY (collection_id) REFERENCES user_collections(id) ON DELETE CASCADE,
  FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE
);

-- ============================================================================
-- AUTHENTICATION & SESSION MANAGEMENT
-- ============================================================================

-- User sessions for authentication management
CREATE TABLE IF NOT EXISTS user_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  session_token TEXT NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================================
-- MODERATION & REPORTING SYSTEM
-- ============================================================================

-- Quote reports for content moderation
CREATE TABLE IF NOT EXISTS quote_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quote_id INTEGER NOT NULL,
  reporter_id INTEGER NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('spam', 'inappropriate', 'copyright', 'misinformation', 'other')),
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved')),
  reviewed_by INTEGER,
  reviewed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE,
  FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES users(id)
);

-- General and content-specific user messages/reports (supports anonymous)
-- NOTE: user_id is NULL for anonymous messages
--       name and email are optional for anonymous messages
--       target_id is nullable when general
--       IP address is for anonymous rate limiting
CREATE TABLE IF NOT EXISTS user_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  name TEXT,
  email TEXT,
  category TEXT NOT NULL CHECK (category IN ('bug', 'feature', 'feedback', 'content', 'other')),
  tags TEXT DEFAULT '[]' CHECK (json_valid(tags)),
  message TEXT NOT NULL CHECK (length(message) >= 10 AND length(message) <= 4000),
  target_type TEXT DEFAULT 'general' CHECK (target_type IN ('general', 'quote', 'author', 'reference')),
  target_id INTEGER,
  ip_address TEXT,
  user_agent TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'triaged', 'spam', 'resolved')),
  reviewed_by INTEGER,
  reviewed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================================
-- ANALYTICS & TRACKING
-- ============================================================================

-- Quote views tracking for analytics and engagement metrics
-- NOTE: user_id is NULL for anonymous views
--       ip_address is for anonymous tracking
CREATE TABLE IF NOT EXISTS quote_views (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quote_id INTEGER NOT NULL,
  user_id INTEGER,
  ip_address TEXT,
  user_agent TEXT,
  viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Author views tracking for analytics and engagement metrics
-- NOTE: user_id is NULL for anonymous views
--       ip_address is for anonymous tracking
CREATE TABLE IF NOT EXISTS author_views (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  author_id INTEGER NOT NULL,
  user_id INTEGER,
  ip_address TEXT,
  user_agent TEXT,
  viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES authors(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Reference views tracking for analytics and engagement metrics
-- NOTE: user_id is NULL for anonymous views
--       ip_address is for anonymous tracking
CREATE TABLE IF NOT EXISTS reference_views (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference_id INTEGER NOT NULL,
  user_id INTEGER,
  ip_address TEXT,
  user_agent TEXT,
  viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reference_id) REFERENCES quote_references(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Export logs for tracking admin data exports (unified for all data types)
CREATE TABLE IF NOT EXISTS export_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  export_id TEXT NOT NULL UNIQUE,
  filename TEXT NOT NULL,
  format TEXT NOT NULL,
  data_type TEXT NOT NULL CHECK (data_type IN ('all', 'authors', 'quotes', 'references', 'tags', 'users')),
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

-- Import logs for tracking admin data imports (unified for all data types)
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

-- Import logs indexes
CREATE INDEX IF NOT EXISTS idx_import_logs_import_id ON import_logs(import_id);
CREATE INDEX IF NOT EXISTS idx_import_logs_status ON import_logs(status);
CREATE INDEX IF NOT EXISTS idx_import_logs_created ON import_logs(created_at DESC);

-- Backup files stored in Cloudflare R2 via NuxtHub blob storage
-- Field notes:
--   file_key: R2 object key (unique identifier)
--   export_log_id: Link to export_logs (optional for standalone backups)
--   import_log_id: Link to import_logs (optional for import backups)
--   filename: Original filename
--   file_path: Full R2 path (archives/YYYY-MM-DD/filename)
--   compressed_size: Compressed size if gzipped
--   content_hash: SHA-256 hash for integrity verification
--   compression_type: 'none', 'gzip'
--   retention_days: Retention period in days
--   last_accessed_at: Track access for analytics
--   access_count: Download count
--   metadata: JSON metadata (export config, etc.)
CREATE TABLE IF NOT EXISTS backup_files (
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

-- ============================================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- ============================================================================

-- User table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Quote table indexes
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_author ON quotes(author_id);
CREATE INDEX IF NOT EXISTS idx_quotes_reference ON quotes(reference_id);
CREATE INDEX IF NOT EXISTS idx_quotes_user ON quotes(user_id);
CREATE INDEX IF NOT EXISTS idx_quotes_created ON quotes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quotes_featured ON quotes(is_featured);
CREATE INDEX IF NOT EXISTS idx_quotes_language ON quotes(language);

-- Author table indexes
CREATE INDEX IF NOT EXISTS idx_authors_name ON authors(name);

-- Reference table indexes
CREATE INDEX IF NOT EXISTS idx_references_type ON quote_references(primary_type);

-- User interaction indexes
CREATE INDEX IF NOT EXISTS idx_user_likes_user ON user_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_likes_likeable ON user_likes(likeable_type, likeable_id);

-- Session management indexes
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);

-- Moderation indexes
CREATE INDEX IF NOT EXISTS idx_quote_reports_status ON quote_reports(status);
CREATE INDEX IF NOT EXISTS idx_user_messages_created ON user_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_messages_category ON user_messages(category);
CREATE INDEX IF NOT EXISTS idx_user_messages_status ON user_messages(status);
CREATE INDEX IF NOT EXISTS idx_user_messages_target ON user_messages(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_user_messages_user ON user_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_user_messages_ip ON user_messages(ip_address);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_quote_views_quote ON quote_views(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_views_user ON quote_views(user_id);
CREATE INDEX IF NOT EXISTS idx_quote_views_date ON quote_views(viewed_at DESC);

CREATE INDEX IF NOT EXISTS idx_author_views_author ON author_views(author_id);
CREATE INDEX IF NOT EXISTS idx_author_views_user ON author_views(user_id);
CREATE INDEX IF NOT EXISTS idx_author_views_date ON author_views(viewed_at DESC);

CREATE INDEX IF NOT EXISTS idx_reference_views_reference ON reference_views(reference_id);
CREATE INDEX IF NOT EXISTS idx_reference_views_user ON reference_views(user_id);
CREATE INDEX IF NOT EXISTS idx_reference_views_date ON reference_views(viewed_at DESC);

-- Export logs indexes
CREATE INDEX IF NOT EXISTS idx_export_logs_export_id ON export_logs(export_id);
CREATE INDEX IF NOT EXISTS idx_export_logs_user ON export_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_export_logs_data_type ON export_logs(data_type);
CREATE INDEX IF NOT EXISTS idx_export_logs_created ON export_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_export_logs_expires ON export_logs(expires_at);

-- Backup files indexes
CREATE INDEX IF NOT EXISTS idx_backup_files_import_log ON backup_files(import_log_id);

CREATE INDEX IF NOT EXISTS idx_backup_files_file_key ON backup_files(file_key);
CREATE INDEX IF NOT EXISTS idx_backup_files_export_log ON backup_files(export_log_id);
CREATE INDEX IF NOT EXISTS idx_backup_files_status ON backup_files(storage_status);
CREATE INDEX IF NOT EXISTS idx_backup_files_created ON backup_files(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_backup_files_expires ON backup_files(expires_at);
CREATE INDEX IF NOT EXISTS idx_backup_files_path ON backup_files(file_path);

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMP UPDATES
-- ============================================================================

-- Update users.updated_at on any update
CREATE TRIGGER IF NOT EXISTS update_users_timestamp
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
  UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

-- Update quotes.updated_at on any update
CREATE TRIGGER IF NOT EXISTS update_quotes_timestamp
AFTER UPDATE ON quotes
FOR EACH ROW
BEGIN
  UPDATE quotes SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

-- Update authors.updated_at on any update
CREATE TRIGGER IF NOT EXISTS update_authors_timestamp
AFTER UPDATE ON authors
FOR EACH ROW
BEGIN
  UPDATE authors SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

-- Update quote_references.updated_at on any update
CREATE TRIGGER IF NOT EXISTS update_references_timestamp
AFTER UPDATE ON quote_references
FOR EACH ROW
BEGIN
  UPDATE quote_references SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

-- Update user_collections.updated_at on any update
CREATE TRIGGER IF NOT EXISTS update_collections_timestamp
AFTER UPDATE ON user_collections
FOR EACH ROW
BEGIN
  UPDATE user_collections SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

-- ============================================================================
-- TRIGGERS FOR MAINTAINING COUNTS AND METRICS
-- ============================================================================

-- Increment view count when a quote is viewed
CREATE TRIGGER IF NOT EXISTS increment_quote_views
AFTER INSERT ON quote_views
FOR EACH ROW
BEGIN
  UPDATE quotes SET views_count = views_count + 1 WHERE id = NEW.quote_id;
END;

-- Increment view count when an author is viewed
CREATE TRIGGER IF NOT EXISTS increment_author_views
AFTER INSERT ON author_views
FOR EACH ROW
BEGIN
  UPDATE authors SET views_count = views_count + 1 WHERE id = NEW.author_id;
END;

-- Increment likes count when a user likes something (polymorphic)
CREATE TRIGGER IF NOT EXISTS increment_likes_count
AFTER INSERT ON user_likes
FOR EACH ROW
BEGIN
  UPDATE quotes SET likes_count = likes_count + 1
  WHERE NEW.likeable_type = 'quote' AND id = NEW.likeable_id;

  UPDATE authors SET likes_count = likes_count + 1
  WHERE NEW.likeable_type = 'author' AND id = NEW.likeable_id;

  UPDATE quote_references SET likes_count = likes_count + 1
  WHERE NEW.likeable_type = 'reference' AND id = NEW.likeable_id;
END;

-- Increment view count when a reference is viewed
CREATE TRIGGER IF NOT EXISTS increment_reference_views
AFTER INSERT ON reference_views
FOR EACH ROW
BEGIN
  UPDATE quote_references SET views_count = views_count + 1 WHERE id = NEW.reference_id;
END;

-- Decrement likes count when a user unlikes something (polymorphic)
CREATE TRIGGER IF NOT EXISTS decrement_likes_count
AFTER DELETE ON user_likes
FOR EACH ROW
BEGIN
  UPDATE quotes SET likes_count = likes_count - 1
  WHERE OLD.likeable_type = 'quote' AND id = OLD.likeable_id;

  UPDATE authors SET likes_count = likes_count - 1
  WHERE OLD.likeable_type = 'author' AND id = OLD.likeable_id;

  UPDATE quote_references SET likes_count = likes_count - 1
  WHERE OLD.likeable_type = 'reference' AND id = OLD.likeable_id;
END;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================