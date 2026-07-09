-- Create sponsor_messages table for the dynamic SponsorBar
CREATE TABLE IF NOT EXISTS sponsor_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  message TEXT NOT NULL,
  leading_icon TEXT,
  trailing_icon TEXT,
  url TEXT,
  type TEXT NOT NULL DEFAULT 'internal' CHECK (type IN ('internal', 'sponsored')),
  is_active INTEGER DEFAULT 1,
  priority INTEGER NOT NULL DEFAULT 0,
  starts_at TEXT,
  ends_at TEXT,
  max_views INTEGER,
  views_count INTEGER DEFAULT 0,
  clicks_count INTEGER DEFAULT 0,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  paid INTEGER DEFAULT 0,
  payment_ref TEXT,
  created_at INTEGER DEFAULT (strftime('%s','now') * 1000),
  updated_at INTEGER DEFAULT (strftime('%s','now') * 1000)
);

CREATE INDEX IF NOT EXISTS idx_sponsor_messages_active ON sponsor_messages(is_active);
CREATE INDEX IF NOT EXISTS idx_sponsor_messages_priority ON sponsor_messages(priority DESC);
CREATE INDEX IF NOT EXISTS idx_sponsor_messages_dates ON sponsor_messages(starts_at, ends_at);
CREATE INDEX IF NOT EXISTS idx_sponsor_messages_type ON sponsor_messages(type);
