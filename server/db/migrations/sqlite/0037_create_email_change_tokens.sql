CREATE TABLE IF NOT EXISTS email_change_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  new_email TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  used_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_email_change_tokens_user ON email_change_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_email_change_tokens_email ON email_change_tokens(new_email);
CREATE INDEX IF NOT EXISTS idx_email_change_tokens_expires ON email_change_tokens(expires_at);
