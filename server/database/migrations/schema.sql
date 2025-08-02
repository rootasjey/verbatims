-- ============================================================================
-- VERBATIMS QUOTES APPLICATION - CONSOLIDATED DATABASE SCHEMA
-- ============================================================================
-- This file contains the complete database schema for the Verbatims quotes
-- application. It consolidates all previous migration files into a single
-- source of truth for database structure.
--
-- Generated: 2025-07-16
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
  language TEXT DEFAULT 'en' CHECK (language IN ('en', 'fr', 'es', 'de', 'it', 'pt', 'ru', 'ja', 'zh')),
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

-- ============================================================================
-- ANALYTICS & TRACKING
-- ============================================================================

-- Quote views tracking for analytics and engagement metrics
CREATE TABLE IF NOT EXISTS quote_views (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quote_id INTEGER NOT NULL,
  user_id INTEGER, -- NULL for anonymous views
  ip_address TEXT, -- For anonymous tracking
  user_agent TEXT,
  viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Export logs for tracking admin data exports (unified for all data types)
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

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_quote_views_quote ON quote_views(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_views_user ON quote_views(user_id);
CREATE INDEX IF NOT EXISTS idx_quote_views_date ON quote_views(viewed_at DESC);

-- Export logs indexes
CREATE INDEX IF NOT EXISTS idx_export_logs_export_id ON export_logs(export_id);
CREATE INDEX IF NOT EXISTS idx_export_logs_user ON export_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_export_logs_data_type ON export_logs(data_type);
CREATE INDEX IF NOT EXISTS idx_export_logs_created ON export_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_export_logs_expires ON export_logs(expires_at);

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