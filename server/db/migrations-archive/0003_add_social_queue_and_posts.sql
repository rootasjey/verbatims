CREATE TABLE IF NOT EXISTS social_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quote_id INTEGER NOT NULL,
  platform TEXT NOT NULL DEFAULT 'x' CHECK (platform IN ('x', 'bluesky', 'instagram')),
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'posted', 'failed')),
  position INTEGER NOT NULL DEFAULT 0,
  scheduled_for INTEGER,
  created_by INTEGER,
  created_at INTEGER DEFAULT CURRENT_TIMESTAMP,
  updated_at INTEGER DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS social_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quote_id INTEGER NOT NULL,
  queue_id INTEGER,
  platform TEXT NOT NULL DEFAULT 'x' CHECK (platform IN ('x', 'bluesky', 'instagram')),
  status TEXT NOT NULL CHECK (status IN ('success', 'failed')),
  post_text TEXT NOT NULL,
  post_url TEXT,
  external_post_id TEXT,
  error_message TEXT,
  idempotency_key TEXT NOT NULL UNIQUE,
  posted_at INTEGER DEFAULT CURRENT_TIMESTAMP,
  created_at INTEGER DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE,
  FOREIGN KEY (queue_id) REFERENCES social_queue(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_social_queue_platform_status_position ON social_queue(platform, status, position);
CREATE INDEX IF NOT EXISTS idx_social_queue_status_scheduled ON social_queue(status, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_social_queue_quote ON social_queue(quote_id);

CREATE INDEX IF NOT EXISTS idx_social_posts_quote_platform ON social_posts(quote_id, platform);
CREATE INDEX IF NOT EXISTS idx_social_posts_posted_at ON social_posts(posted_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_posts_queue ON social_posts(queue_id);
