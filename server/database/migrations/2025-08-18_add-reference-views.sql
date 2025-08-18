-- Migration: Add reference views tracking table and trigger
-- Environment: SQLite (Cloudflare D1)

-- Create table to track reference views
CREATE TABLE IF NOT EXISTS reference_views (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference_id INTEGER NOT NULL,
  user_id INTEGER, -- NULL for anonymous views
  ip_address TEXT, -- For anonymous tracking
  user_agent TEXT,
  viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reference_id) REFERENCES quote_references(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_reference_views_reference ON reference_views(reference_id);
CREATE INDEX IF NOT EXISTS idx_reference_views_user ON reference_views(user_id);
CREATE INDEX IF NOT EXISTS idx_reference_views_date ON reference_views(viewed_at DESC);

-- Trigger to increment reference views_count on insert
CREATE TRIGGER IF NOT EXISTS increment_reference_views
AFTER INSERT ON reference_views
FOR EACH ROW
BEGIN
  UPDATE quote_references SET views_count = views_count + 1 WHERE id = NEW.reference_id;
END;
