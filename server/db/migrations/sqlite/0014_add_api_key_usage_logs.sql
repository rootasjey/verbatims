-- Migration: Add API key usage logs table
-- Tracks API calls made with each API key for billing and analytics

CREATE TABLE IF NOT EXISTS api_key_usage_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  api_key_id INTEGER NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL DEFAULT 'GET',
  status_code INTEGER NOT NULL DEFAULT 200,
  ip_address TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_usage_logs_api_key ON api_key_usage_logs(api_key_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created ON api_key_usage_logs(created_at);
