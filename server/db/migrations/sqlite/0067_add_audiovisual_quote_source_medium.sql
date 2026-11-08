-- quote_sources has no dependent tables, so rebuild only this child table to
-- widen its source_medium CHECK constraint while preserving all rows and rules.
DROP TRIGGER quote_sources_require_matching_attribution_on_insert;
DROP TRIGGER quote_sources_require_matching_attribution_on_update;
DROP TRIGGER quote_sources_require_matching_occurrence_on_insert;
DROP TRIGGER quote_sources_require_matching_occurrence_on_update;
DROP TRIGGER quote_occurrences_require_matching_sources_on_update;
DROP TRIGGER quote_editorial_audit_sources_insert;
DROP TRIGGER quote_editorial_audit_sources_update;
DROP TRIGGER quote_editorial_audit_sources_delete;

CREATE TABLE quote_sources_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quote_id INTEGER NOT NULL,
  attribution_id INTEGER,
  occurrence_id INTEGER,
  source_type TEXT NOT NULL,
  source_medium TEXT CHECK (source_medium IN ('book', 'web_page', 'transcript', 'audio', 'audiovisual', 'document', 'other')),
  source_url TEXT,
  label TEXT,
  locator_type TEXT CHECK (locator_type IN ('page', 'chapter', 'timecode')),
  locator_value TEXT,
  translator_name TEXT,
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
  FOREIGN KEY (occurrence_id) REFERENCES quote_occurrences(id) ON DELETE SET NULL,
  FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

INSERT INTO quote_sources_new (
  id, quote_id, attribution_id, occurrence_id, source_type, source_medium,
  source_url, label, locator_type, locator_value, translator_name,
  verification_status, verified_by, verified_at, notes, is_primary,
  created_by, created_at, updated_at
)
SELECT
  id, quote_id, attribution_id, occurrence_id, source_type, source_medium,
  source_url, label, locator_type, locator_value, translator_name,
  verification_status, verified_by, verified_at, notes, is_primary,
  created_by, created_at, updated_at
FROM quote_sources;

DROP TABLE quote_sources;
ALTER TABLE quote_sources_new RENAME TO quote_sources;

CREATE INDEX idx_quote_sources_quote ON quote_sources(quote_id);
CREATE INDEX idx_quote_sources_attribution ON quote_sources(attribution_id);
CREATE INDEX idx_quote_sources_occurrence ON quote_sources(occurrence_id);
CREATE INDEX idx_quote_sources_status ON quote_sources(verification_status);
CREATE UNIQUE INDEX idx_quote_sources_one_primary
  ON quote_sources(quote_id) WHERE is_primary = TRUE;

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

CREATE TRIGGER quote_editorial_audit_sources_insert AFTER INSERT ON quote_sources
WHEN EXISTS (SELECT 1 FROM quote_editorial_audit_context WHERE id = 1)
BEGIN
  INSERT INTO quote_editorial_audit_events (actor_user_id, actor_user_name, api_key_id, api_key_name, api_key_prefix, action, target_type, target_id, after_json, source, task_id, request_id)
  SELECT actor_user_id, actor_user_name, api_key_id, api_key_name, api_key_prefix, 'create', 'source', CAST(NEW.id AS TEXT),
    json_object('id', NEW.id, 'quote_id', NEW.quote_id, 'attribution_id', NEW.attribution_id, 'occurrence_id', NEW.occurrence_id, 'source_type', NEW.source_type, 'source_medium', NEW.source_medium, 'source_url', NEW.source_url, 'label', NEW.label, 'locator_type', NEW.locator_type, 'locator_value', NEW.locator_value, 'translator_name', NEW.translator_name, 'verification_status', NEW.verification_status, 'verified_by', NEW.verified_by, 'verified_at', NEW.verified_at, 'notes', NEW.notes, 'is_primary', NEW.is_primary, 'created_by', NEW.created_by, 'created_at', NEW.created_at, 'updated_at', NEW.updated_at), source, task_id, request_id
  FROM quote_editorial_audit_context WHERE id = 1;
END;

CREATE TRIGGER quote_editorial_audit_sources_update AFTER UPDATE ON quote_sources
WHEN EXISTS (SELECT 1 FROM quote_editorial_audit_context WHERE id = 1)
BEGIN
  INSERT INTO quote_editorial_audit_events (actor_user_id, actor_user_name, api_key_id, api_key_name, api_key_prefix, action, target_type, target_id, before_json, after_json, source, task_id, request_id)
  SELECT actor_user_id, actor_user_name, api_key_id, api_key_name, api_key_prefix, 'update', 'source', CAST(NEW.id AS TEXT),
    json_object('id', OLD.id, 'quote_id', OLD.quote_id, 'attribution_id', OLD.attribution_id, 'occurrence_id', OLD.occurrence_id, 'source_type', OLD.source_type, 'source_medium', OLD.source_medium, 'source_url', OLD.source_url, 'label', OLD.label, 'locator_type', OLD.locator_type, 'locator_value', OLD.locator_value, 'translator_name', OLD.translator_name, 'verification_status', OLD.verification_status, 'verified_by', OLD.verified_by, 'verified_at', OLD.verified_at, 'notes', OLD.notes, 'is_primary', OLD.is_primary, 'created_by', OLD.created_by, 'created_at', OLD.created_at, 'updated_at', OLD.updated_at),
    json_object('id', NEW.id, 'quote_id', NEW.quote_id, 'attribution_id', NEW.attribution_id, 'occurrence_id', NEW.occurrence_id, 'source_type', NEW.source_type, 'source_medium', NEW.source_medium, 'source_url', NEW.source_url, 'label', NEW.label, 'locator_type', NEW.locator_type, 'locator_value', NEW.locator_value, 'translator_name', NEW.translator_name, 'verification_status', NEW.verification_status, 'verified_by', NEW.verified_by, 'verified_at', NEW.verified_at, 'notes', NEW.notes, 'is_primary', NEW.is_primary, 'created_by', NEW.created_by, 'created_at', NEW.created_at, 'updated_at', NEW.updated_at), source, task_id, request_id
  FROM quote_editorial_audit_context WHERE id = 1;
END;

CREATE TRIGGER quote_editorial_audit_sources_delete AFTER DELETE ON quote_sources
WHEN EXISTS (SELECT 1 FROM quote_editorial_audit_context WHERE id = 1)
BEGIN
  INSERT INTO quote_editorial_audit_events (actor_user_id, actor_user_name, api_key_id, api_key_name, api_key_prefix, action, target_type, target_id, before_json, source, task_id, request_id)
  SELECT actor_user_id, actor_user_name, api_key_id, api_key_name, api_key_prefix, 'delete', 'source', CAST(OLD.id AS TEXT),
    json_object('id', OLD.id, 'quote_id', OLD.quote_id, 'attribution_id', OLD.attribution_id, 'occurrence_id', OLD.occurrence_id, 'source_type', OLD.source_type, 'source_medium', OLD.source_medium, 'source_url', OLD.source_url, 'label', OLD.label, 'locator_type', OLD.locator_type, 'locator_value', OLD.locator_value, 'translator_name', OLD.translator_name, 'verification_status', OLD.verification_status, 'verified_by', OLD.verified_by, 'verified_at', OLD.verified_at, 'notes', OLD.notes, 'is_primary', OLD.is_primary, 'created_by', OLD.created_by, 'created_at', OLD.created_at, 'updated_at', OLD.updated_at), source, task_id, request_id
  FROM quote_editorial_audit_context WHERE id = 1;
END;
