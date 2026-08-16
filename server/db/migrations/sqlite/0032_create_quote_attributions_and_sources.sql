-- Separate quote text from its author/reference attribution and evidence.
CREATE TABLE IF NOT EXISTS quote_attributions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quote_id INTEGER NOT NULL,
  author_id INTEGER,
  reference_id INTEGER,
  is_primary BOOLEAN NOT NULL DEFAULT TRUE,
  status TEXT NOT NULL DEFAULT 'unverified' CHECK (status IN ('unverified', 'manually_verified', 'externally_verified', 'disputed')),
  verified_by INTEGER,
  verified_at DATETIME,
  notes TEXT,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE,
  FOREIGN KEY (author_id) REFERENCES authors(id) ON DELETE SET NULL,
  FOREIGN KEY (reference_id) REFERENCES quote_references(id) ON DELETE SET NULL,
  FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS quote_sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quote_id INTEGER NOT NULL,
  attribution_id INTEGER,
  source_type TEXT NOT NULL,
  source_url TEXT,
  label TEXT,
  verification_status TEXT NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'manually_verified', 'externally_verified', 'disputed')),
  verified_by INTEGER,
  verified_at DATETIME,
  notes TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE,
  FOREIGN KEY (attribution_id) REFERENCES quote_attributions(id) ON DELETE SET NULL,
  FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_quote_attributions_quote ON quote_attributions(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_attributions_author ON quote_attributions(author_id);
CREATE INDEX IF NOT EXISTS idx_quote_attributions_reference ON quote_attributions(reference_id);
CREATE INDEX IF NOT EXISTS idx_quote_attributions_status ON quote_attributions(status);
CREATE INDEX IF NOT EXISTS idx_quote_sources_quote ON quote_sources(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_sources_attribution ON quote_sources(attribution_id);
CREATE INDEX IF NOT EXISTS idx_quote_sources_status ON quote_sources(verification_status);

-- Backfill one primary attribution for every existing quote.
INSERT INTO quote_attributions (quote_id, author_id, reference_id, is_primary, status, created_by, created_at, updated_at)
SELECT id, author_id, reference_id, TRUE, 'unverified', user_id, created_at, updated_at
FROM quotes;

-- Preserve existing source fields without assuming that their evidence was verified.
INSERT INTO quote_sources (quote_id, attribution_id, source_type, source_url, label, is_primary, created_by, created_at, updated_at)
SELECT q.id, a.id, COALESCE(q.source_type, 'legacy'), q.source_url, q.source_type, TRUE, q.user_id, q.created_at, q.updated_at
FROM quotes q
JOIN quote_attributions a ON a.quote_id = q.id AND a.is_primary = TRUE
WHERE q.source_type IS NOT NULL OR q.source_url IS NOT NULL;
