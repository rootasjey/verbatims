-- Migration: Add API keys table for public API access
-- Creates the api_keys table for external developer API access

CREATE TABLE IF NOT EXISTS api_keys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL,
  permissions TEXT NOT NULL DEFAULT '["read"]' CHECK (json_valid(permissions)),
  rate_limit INTEGER NOT NULL DEFAULT 100,
  window_sec INTEGER NOT NULL DEFAULT 3600,
  is_active INTEGER NOT NULL DEFAULT 1,
  last_used_at INTEGER,
  expires_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(is_active);
