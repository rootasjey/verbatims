PRAGMA foreign_keys = OFF;
BEGIN TRANSACTION;

DROP INDEX IF EXISTS idx_social_queue_platform_status_position;
DROP INDEX IF EXISTS idx_social_queue_status_scheduled;
DROP INDEX IF EXISTS idx_social_queue_quote;
DROP INDEX IF EXISTS idx_social_posts_quote_platform;
DROP INDEX IF EXISTS idx_social_posts_posted_at;
DROP INDEX IF EXISTS idx_social_posts_queue;

CREATE TABLE IF NOT EXISTS social_queue_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quote_id INTEGER NOT NULL,
  platform TEXT NOT NULL DEFAULT 'x' CHECK (platform IN ('x', 'bluesky', 'instagram', 'threads', 'facebook', 'pinterest')),
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'posted', 'failed')),
  position INTEGER NOT NULL DEFAULT 0,
  scheduled_for INTEGER,
  created_by INTEGER,
  created_at INTEGER DEFAULT CURRENT_TIMESTAMP,
  updated_at INTEGER DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

INSERT INTO social_queue_new (
  id,
  quote_id,
  platform,
  status,
  position,
  scheduled_for,
  created_by,
  created_at,
  updated_at
)
SELECT
  id,
  quote_id,
  platform,
  status,
  position,
  scheduled_for,
  created_by,
  created_at,
  updated_at
FROM social_queue;

DROP TABLE social_queue;
ALTER TABLE social_queue_new RENAME TO social_queue;

CREATE TABLE IF NOT EXISTS social_posts_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quote_id INTEGER NOT NULL,
  queue_id INTEGER,
  platform TEXT NOT NULL DEFAULT 'x' CHECK (platform IN ('x', 'bluesky', 'instagram', 'threads', 'facebook', 'pinterest')),
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

INSERT INTO social_posts_new (
  id,
  quote_id,
  queue_id,
  platform,
  status,
  post_text,
  post_url,
  external_post_id,
  error_message,
  idempotency_key,
  posted_at,
  created_at
)
SELECT
  id,
  quote_id,
  queue_id,
  platform,
  status,
  post_text,
  post_url,
  external_post_id,
  error_message,
  idempotency_key,
  posted_at,
  created_at
FROM social_posts;

DROP TABLE social_posts;
ALTER TABLE social_posts_new RENAME TO social_posts;

CREATE INDEX IF NOT EXISTS idx_social_queue_platform_status_position ON social_queue(platform, status, position);
CREATE INDEX IF NOT EXISTS idx_social_queue_status_scheduled ON social_queue(status, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_social_queue_quote ON social_queue(quote_id);

CREATE INDEX IF NOT EXISTS idx_social_posts_quote_platform ON social_posts(quote_id, platform);
CREATE INDEX IF NOT EXISTS idx_social_posts_posted_at ON social_posts(posted_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_posts_queue ON social_posts(queue_id);

COMMIT;
PRAGMA foreign_keys = ON;
