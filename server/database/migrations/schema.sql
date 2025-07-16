-- Users table (required for foreign keys)
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin')),
  is_active BOOLEAN DEFAULT TRUE,
  email_verified BOOLEAN DEFAULT FALSE,
  last_login_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Authors table
CREATE TABLE IF NOT EXISTS authors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE CHECK (length(name) >= 2 AND length(name) <= 100),
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

-- References table (renamed to avoid reserved keyword)
CREATE TABLE IF NOT EXISTS quote_references (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL CHECK (length(name) >= 2 AND length(name) <= 200),
  original_language TEXT DEFAULT 'en',
  release_date DATE,
  description TEXT,
  primary_type TEXT NOT NULL CHECK (primary_type IN ('film', 'book', 'tv_series', 'music', 'speech', 'podcast', 'interview', 'documentary', 'other')),
  secondary_type TEXT, -- genre/category like 'horror', 'comedy', 'biography', etc.
  image_url TEXT,
  urls TEXT DEFAULT '[]' CHECK (json_valid(urls)), -- JSON array of related URLs
  imdb_id TEXT, -- For films/TV series
  isbn TEXT, -- For books
  spotify_id TEXT, -- For music/podcasts
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Quotes table
CREATE TABLE IF NOT EXISTS quotes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL CHECK (length(name) >= 10 AND length(name) <= 3000),
  language TEXT DEFAULT 'en' CHECK (language IN ('en', 'fr', 'es', 'de', 'it', 'pt', 'ru', 'ja', 'zh')),
  author_id INTEGER,
  reference_id INTEGER,
  user_id INTEGER NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'rejected')),
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

-- Tags system
CREATE TABLE IF NOT EXISTS tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#3B82F6',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS quote_tags (
  quote_id INTEGER,
  tag_id INTEGER,
  PRIMARY KEY (quote_id, tag_id),
  FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- User interactions
CREATE TABLE IF NOT EXISTS user_likes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  likeable_type TEXT NOT NULL CHECK (likeable_type IN ('quote', 'author', 'reference')),
  likeable_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, likeable_type, likeable_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

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

CREATE TABLE IF NOT EXISTS collection_quotes (
  collection_id INTEGER,
  quote_id INTEGER,
  added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (collection_id, quote_id),
  FOREIGN KEY (collection_id) REFERENCES user_collections(id) ON DELETE CASCADE,
  FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE
);

-- Additional tables for comprehensive functionality

-- User sessions for auth management
CREATE TABLE IF NOT EXISTS user_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  session_token TEXT NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Quote reports for moderation
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

-- Quote views tracking for analytics
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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_author ON quotes(author_id);
CREATE INDEX IF NOT EXISTS idx_quotes_reference ON quotes(reference_id);
CREATE INDEX IF NOT EXISTS idx_quotes_user ON quotes(user_id);
CREATE INDEX IF NOT EXISTS idx_quotes_created ON quotes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quotes_featured ON quotes(is_featured);
CREATE INDEX IF NOT EXISTS idx_quotes_language ON quotes(language);
CREATE INDEX IF NOT EXISTS idx_authors_name ON authors(name);
CREATE INDEX IF NOT EXISTS idx_references_type ON quote_references(primary_type);
CREATE INDEX IF NOT EXISTS idx_references_imdb ON quote_references(imdb_id);
CREATE INDEX IF NOT EXISTS idx_references_isbn ON quote_references(isbn);
CREATE INDEX IF NOT EXISTS idx_user_likes_user ON user_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_likes_likeable ON user_likes(likeable_type, likeable_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_quote_reports_status ON quote_reports(status);
CREATE INDEX IF NOT EXISTS idx_quote_views_quote ON quote_views(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_views_user ON quote_views(user_id);
CREATE INDEX IF NOT EXISTS idx_quote_views_date ON quote_views(viewed_at DESC);

-- Triggers for updated_at timestamps
CREATE TRIGGER IF NOT EXISTS update_users_timestamp
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
  UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS update_quotes_timestamp
AFTER UPDATE ON quotes
FOR EACH ROW
BEGIN
  UPDATE quotes SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS update_authors_timestamp
AFTER UPDATE ON authors
FOR EACH ROW
BEGIN
  UPDATE authors SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS update_references_timestamp
AFTER UPDATE ON quote_references
FOR EACH ROW
BEGIN
  UPDATE quote_references SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS update_collections_timestamp
AFTER UPDATE ON user_collections
FOR EACH ROW
BEGIN
  UPDATE user_collections SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

-- Triggers for maintaining counts
CREATE TRIGGER IF NOT EXISTS increment_quote_views
AFTER INSERT ON quote_views
FOR EACH ROW
BEGIN
  UPDATE quotes SET views_count = views_count + 1 WHERE id = NEW.quote_id;
END;

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