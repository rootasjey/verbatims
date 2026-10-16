CREATE TABLE quote_audit_reviews (
  quote_id INTEGER PRIMARY KEY NOT NULL,
  progress TEXT NOT NULL DEFAULT 'pending'
    CHECK (progress IN ('pending', 'in_progress', 'awaiting_review', 'reviewed')),
  outcome TEXT
    CHECK (outcome IS NULL OR outcome IN ('source_candidate_found', 'possible_misattribution', 'primary_source_confirmed', 'no_primary_source_found', 'disputed', 'inconclusive')),
  notes TEXT,
  reviewed_by INTEGER,
  reviewed_at DATETIME,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_quote_audit_reviews_progress ON quote_audit_reviews(progress);
CREATE INDEX idx_quote_audit_reviews_outcome ON quote_audit_reviews(outcome);
