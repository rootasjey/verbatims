DROP TRIGGER IF EXISTS quote_occurrences_require_matching_attribution_on_insert;
DROP TRIGGER IF EXISTS quote_occurrences_require_matching_attribution_on_update;
DROP TRIGGER IF EXISTS quote_occurrences_require_matching_sources_on_update;
DROP TRIGGER IF EXISTS quote_sources_require_matching_occurrence_on_insert;
DROP TRIGGER IF EXISTS quote_sources_require_matching_occurrence_on_update;
DROP TRIGGER IF EXISTS quote_sources_require_matching_attribution_on_insert;
DROP TRIGGER IF EXISTS quote_sources_require_matching_attribution_on_update;

DROP INDEX idx_quote_occurrences_quote;
DROP INDEX idx_quote_occurrences_attribution;
DROP INDEX idx_quote_occurrences_author;
DROP INDEX idx_quote_occurrences_reference;
DROP INDEX idx_quote_sources_occurrence;

ALTER TABLE quote_occurrences RENAME TO quote_occurrences_old;

CREATE TABLE quote_occurrences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quote_id INTEGER NOT NULL,
  attribution_id INTEGER,
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
  FOREIGN KEY (attribution_id) REFERENCES quote_attributions(id) ON DELETE SET NULL,
  FOREIGN KEY (author_id) REFERENCES authors(id) ON DELETE SET NULL,
  FOREIGN KEY (reference_id) REFERENCES quote_references(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

INSERT INTO quote_occurrences (
  id, quote_id, attribution_id, author_id, reference_id, occurrence_type,
  occurred_at, date_notes, context, excerpt, notes, created_by, created_at, updated_at
)
SELECT
  id, quote_id, attribution_id, author_id, reference_id, occurrence_type,
  occurred_at, date_notes, context, excerpt, notes, created_by, created_at, updated_at
FROM quote_occurrences_old;

CREATE TABLE quote_sources_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quote_id INTEGER NOT NULL,
  attribution_id INTEGER,
  occurrence_id INTEGER,
  source_type TEXT NOT NULL,
  source_url TEXT,
  label TEXT,
  translator_name TEXT,
  verification_status TEXT NOT NULL DEFAULT 'unverified'
    CHECK (verification_status IN ('unverified', 'manually_verified', 'externally_verified', 'disputed')),
  verified_by INTEGER,
  verified_at DATETIME,
  notes TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE,
  FOREIGN KEY (attribution_id) REFERENCES quote_attributions(id) ON DELETE SET NULL,
  FOREIGN KEY (occurrence_id) REFERENCES quote_occurrences(id) ON DELETE SET NULL,
  FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

INSERT INTO quote_sources_new (
  id, quote_id, attribution_id, occurrence_id, source_type, source_url, label,
  translator_name, verification_status, verified_by, verified_at, notes,
  is_primary, created_by, created_at, updated_at
)
SELECT
  id, quote_id, attribution_id, occurrence_id, source_type, source_url, label,
  translator_name, verification_status, verified_by, verified_at, notes,
  is_primary, created_by, created_at, updated_at
FROM quote_sources;

DROP TABLE quote_sources;
ALTER TABLE quote_sources_new RENAME TO quote_sources;
DROP TABLE quote_occurrences_old;

CREATE INDEX idx_quote_occurrences_quote ON quote_occurrences(quote_id);
CREATE INDEX idx_quote_occurrences_attribution ON quote_occurrences(attribution_id);
CREATE INDEX idx_quote_occurrences_author ON quote_occurrences(author_id);
CREATE INDEX idx_quote_occurrences_reference ON quote_occurrences(reference_id);
CREATE INDEX idx_quote_sources_quote ON quote_sources(quote_id);
CREATE INDEX idx_quote_sources_attribution ON quote_sources(attribution_id);
CREATE INDEX idx_quote_sources_occurrence ON quote_sources(occurrence_id);
CREATE INDEX idx_quote_sources_status ON quote_sources(verification_status);
CREATE UNIQUE INDEX idx_quote_sources_one_primary
  ON quote_sources(quote_id) WHERE is_primary = TRUE;

CREATE TRIGGER quote_occurrences_require_matching_attribution_on_insert
BEFORE INSERT ON quote_occurrences
WHEN NEW.attribution_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM quote_attributions
  WHERE id = NEW.attribution_id AND quote_id = NEW.quote_id
)
BEGIN
  SELECT RAISE(ABORT, 'An occurrence attribution must belong to the same quote');
END;

CREATE TRIGGER quote_occurrences_require_matching_attribution_on_update
BEFORE UPDATE OF quote_id, attribution_id ON quote_occurrences
WHEN NEW.attribution_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM quote_attributions
  WHERE id = NEW.attribution_id AND quote_id = NEW.quote_id
)
BEGIN
  SELECT RAISE(ABORT, 'An occurrence attribution must belong to the same quote');
END;

CREATE TRIGGER quote_occurrences_require_matching_sources_on_update
BEFORE UPDATE OF quote_id, attribution_id ON quote_occurrences
WHEN EXISTS (
  SELECT 1 FROM quote_sources
  WHERE occurrence_id = NEW.id
    AND (quote_id != NEW.quote_id OR (NEW.attribution_id IS NOT NULL AND attribution_id != NEW.attribution_id))
)
BEGIN
  SELECT RAISE(ABORT, 'An occurrence must keep linked sources on the same quote and attribution');
END;

CREATE TRIGGER quote_sources_require_matching_attribution_on_insert
BEFORE INSERT ON quote_sources
WHEN NEW.attribution_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM quote_attributions
  WHERE id = NEW.attribution_id AND quote_id = NEW.quote_id
)
BEGIN
  SELECT RAISE(ABORT, 'A source must belong to an attribution of the same quote');
END;

CREATE TRIGGER quote_sources_require_matching_attribution_on_update
BEFORE UPDATE OF quote_id, attribution_id ON quote_sources
WHEN NEW.attribution_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM quote_attributions
  WHERE id = NEW.attribution_id AND quote_id = NEW.quote_id
)
BEGIN
  SELECT RAISE(ABORT, 'A source must belong to an attribution of the same quote');
END;

CREATE TRIGGER quote_sources_require_matching_occurrence_on_insert
BEFORE INSERT ON quote_sources
WHEN NEW.occurrence_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM quote_occurrences
  WHERE id = NEW.occurrence_id
    AND quote_id = NEW.quote_id
    AND (attribution_id IS NULL OR NEW.attribution_id IS NULL OR attribution_id = NEW.attribution_id)
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
    AND (attribution_id IS NULL OR NEW.attribution_id IS NULL OR attribution_id = NEW.attribution_id)
)
BEGIN
  SELECT RAISE(ABORT, 'A source occurrence must match its quote and attribution');
END;
