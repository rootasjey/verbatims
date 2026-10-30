CREATE TABLE quote_occurrences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quote_id INTEGER NOT NULL,
  attribution_id INTEGER NOT NULL,
  author_id INTEGER,
  reference_id INTEGER,
  occurrence_type TEXT NOT NULL DEFAULT 'quotation'
    CHECK (occurrence_type IN ('origin', 'quotation', 'adaptation', 'performance', 'other')),
  occurred_at TEXT,
  date_notes TEXT,
  context TEXT,
  excerpt TEXT,
  notes TEXT,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE,
  FOREIGN KEY (attribution_id) REFERENCES quote_attributions(id) ON DELETE CASCADE,
  FOREIGN KEY (author_id) REFERENCES authors(id) ON DELETE SET NULL,
  FOREIGN KEY (reference_id) REFERENCES quote_references(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_quote_occurrences_quote ON quote_occurrences(quote_id);
CREATE INDEX idx_quote_occurrences_attribution ON quote_occurrences(attribution_id);
CREATE INDEX idx_quote_occurrences_author ON quote_occurrences(author_id);
CREATE INDEX idx_quote_occurrences_reference ON quote_occurrences(reference_id);

ALTER TABLE quote_sources
  ADD COLUMN occurrence_id INTEGER REFERENCES quote_occurrences(id) ON DELETE SET NULL;

CREATE INDEX idx_quote_sources_occurrence ON quote_sources(occurrence_id);

CREATE TRIGGER quote_occurrences_require_matching_attribution_on_insert
BEFORE INSERT ON quote_occurrences
WHEN NOT EXISTS (
  SELECT 1 FROM quote_attributions
  WHERE id = NEW.attribution_id AND quote_id = NEW.quote_id
)
BEGIN
  SELECT RAISE(ABORT, 'An occurrence must belong to an attribution of the same quote');
END;

CREATE TRIGGER quote_occurrences_require_matching_attribution_on_update
BEFORE UPDATE OF quote_id, attribution_id ON quote_occurrences
WHEN NOT EXISTS (
  SELECT 1 FROM quote_attributions
  WHERE id = NEW.attribution_id AND quote_id = NEW.quote_id
)
BEGIN
  SELECT RAISE(ABORT, 'An occurrence must belong to an attribution of the same quote');
END;

CREATE TRIGGER quote_occurrences_require_matching_sources_on_update
BEFORE UPDATE OF quote_id, attribution_id ON quote_occurrences
WHEN EXISTS (
  SELECT 1 FROM quote_sources
  WHERE occurrence_id = NEW.id
    AND (quote_id != NEW.quote_id OR attribution_id != NEW.attribution_id)
)
BEGIN
  SELECT RAISE(ABORT, 'An occurrence must keep its linked sources on the same attribution');
END;

CREATE TRIGGER quote_sources_require_matching_occurrence_on_insert
BEFORE INSERT ON quote_sources
WHEN NEW.occurrence_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM quote_occurrences
  WHERE id = NEW.occurrence_id
    AND quote_id = NEW.quote_id
    AND attribution_id = NEW.attribution_id
)
BEGIN
  SELECT RAISE(ABORT, 'A source occurrence must match its quote and attribution');
END;

CREATE TRIGGER quote_sources_require_matching_occurrence_on_update
BEFORE UPDATE OF quote_id, attribution_id, occurrence_id ON quote_sources
WHEN NEW.occurrence_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM quote_occurrences
  WHERE id = NEW.occurrence_id
    AND quote_id = NEW.quote_id
    AND attribution_id = NEW.attribution_id
)
BEGIN
  SELECT RAISE(ABORT, 'A source occurrence must match its quote and attribution');
END;
