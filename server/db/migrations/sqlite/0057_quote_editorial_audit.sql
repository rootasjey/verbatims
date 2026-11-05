CREATE TABLE quote_editorial_audit_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  occurred_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actor_user_id INTEGER,
  actor_user_name TEXT,
  api_key_id INTEGER,
  api_key_name TEXT,
  api_key_prefix TEXT,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  before_json TEXT,
  after_json TEXT,
  source TEXT NOT NULL,
  task_id TEXT,
  request_id TEXT
);
CREATE INDEX idx_quote_editorial_audit_occurred_at ON quote_editorial_audit_events(occurred_at);
CREATE INDEX idx_quote_editorial_audit_target ON quote_editorial_audit_events(target_type, target_id);
CREATE INDEX idx_quote_editorial_audit_api_key ON quote_editorial_audit_events(api_key_id);

CREATE TABLE quote_editorial_audit_context (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  actor_user_id INTEGER,
  actor_user_name TEXT,
  api_key_id INTEGER,
  api_key_name TEXT,
  api_key_prefix TEXT,
  source TEXT NOT NULL,
  task_id TEXT,
  request_id TEXT
);

CREATE TRIGGER quote_editorial_audit_events_no_update
BEFORE UPDATE ON quote_editorial_audit_events
BEGIN
  SELECT RAISE(ABORT, 'Editorial audit events are append-only');
END;
CREATE TRIGGER quote_editorial_audit_events_no_delete
BEFORE DELETE ON quote_editorial_audit_events
BEGIN
  SELECT RAISE(ABORT, 'Editorial audit events are append-only');
END;

-- Triggers record actual stored row values and generated IDs. Only writes wrapped in
-- the API audit context are recorded; the context and mutation share one D1 transaction.
CREATE TRIGGER quote_editorial_audit_quotes_insert AFTER INSERT ON quotes
WHEN EXISTS (SELECT 1 FROM quote_editorial_audit_context WHERE id = 1)
BEGIN
  INSERT INTO quote_editorial_audit_events (actor_user_id, actor_user_name, api_key_id, api_key_name, api_key_prefix, action, target_type, target_id, after_json, source, task_id, request_id)
  SELECT actor_user_id, actor_user_name, api_key_id, api_key_name, api_key_prefix, 'create', 'quote', CAST(NEW.id AS TEXT),
    json_object('id', NEW.id, 'name', NEW.name, 'language', NEW.language, 'status', NEW.status, 'user_id', NEW.user_id, 'moderator_id', NEW.moderator_id, 'moderated_at', NEW.moderated_at, 'rejection_reason', NEW.rejection_reason, 'is_featured', NEW.is_featured, 'created_at', NEW.created_at, 'updated_at', NEW.updated_at), source, task_id, request_id
  FROM quote_editorial_audit_context WHERE id = 1;
END;
CREATE TRIGGER quote_editorial_audit_quotes_update AFTER UPDATE ON quotes
WHEN EXISTS (SELECT 1 FROM quote_editorial_audit_context WHERE id = 1)
BEGIN
  INSERT INTO quote_editorial_audit_events (actor_user_id, actor_user_name, api_key_id, api_key_name, api_key_prefix, action, target_type, target_id, before_json, after_json, source, task_id, request_id)
  SELECT actor_user_id, actor_user_name, api_key_id, api_key_name, api_key_prefix, 'update', 'quote', CAST(NEW.id AS TEXT),
    json_object('id', OLD.id, 'name', OLD.name, 'language', OLD.language, 'status', OLD.status, 'user_id', OLD.user_id, 'moderator_id', OLD.moderator_id, 'moderated_at', OLD.moderated_at, 'rejection_reason', OLD.rejection_reason, 'is_featured', OLD.is_featured, 'created_at', OLD.created_at, 'updated_at', OLD.updated_at),
    json_object('id', NEW.id, 'name', NEW.name, 'language', NEW.language, 'status', NEW.status, 'user_id', NEW.user_id, 'moderator_id', NEW.moderator_id, 'moderated_at', NEW.moderated_at, 'rejection_reason', NEW.rejection_reason, 'is_featured', NEW.is_featured, 'created_at', NEW.created_at, 'updated_at', NEW.updated_at), source, task_id, request_id
  FROM quote_editorial_audit_context WHERE id = 1;
END;
CREATE TRIGGER quote_editorial_audit_quotes_delete AFTER DELETE ON quotes
WHEN EXISTS (SELECT 1 FROM quote_editorial_audit_context WHERE id = 1)
BEGIN
  INSERT INTO quote_editorial_audit_events (actor_user_id, actor_user_name, api_key_id, api_key_name, api_key_prefix, action, target_type, target_id, before_json, source, task_id, request_id)
  SELECT actor_user_id, actor_user_name, api_key_id, api_key_name, api_key_prefix, 'delete', 'quote', CAST(OLD.id AS TEXT),
    json_object('id', OLD.id, 'name', OLD.name, 'language', OLD.language, 'status', OLD.status, 'user_id', OLD.user_id, 'moderator_id', OLD.moderator_id, 'moderated_at', OLD.moderated_at, 'rejection_reason', OLD.rejection_reason, 'is_featured', OLD.is_featured, 'created_at', OLD.created_at, 'updated_at', OLD.updated_at), source, task_id, request_id
  FROM quote_editorial_audit_context WHERE id = 1;
END;

CREATE TRIGGER quote_editorial_audit_attributions_insert AFTER INSERT ON quote_attributions
WHEN EXISTS (SELECT 1 FROM quote_editorial_audit_context WHERE id = 1)
BEGIN
  INSERT INTO quote_editorial_audit_events (actor_user_id, actor_user_name, api_key_id, api_key_name, api_key_prefix, action, target_type, target_id, after_json, source, task_id, request_id)
  SELECT actor_user_id, actor_user_name, api_key_id, api_key_name, api_key_prefix, 'create', 'attribution', CAST(NEW.id AS TEXT),
    json_object('id', NEW.id, 'quote_id', NEW.quote_id, 'author_id', NEW.author_id, 'reference_id', NEW.reference_id, 'is_primary', NEW.is_primary, 'status', NEW.status, 'verified_by', NEW.verified_by, 'verified_at', NEW.verified_at, 'notes', NEW.notes, 'created_by', NEW.created_by, 'created_at', NEW.created_at, 'updated_at', NEW.updated_at), source, task_id, request_id
  FROM quote_editorial_audit_context WHERE id = 1;
END;
CREATE TRIGGER quote_editorial_audit_attributions_update AFTER UPDATE ON quote_attributions
WHEN EXISTS (SELECT 1 FROM quote_editorial_audit_context WHERE id = 1)
BEGIN
  INSERT INTO quote_editorial_audit_events (actor_user_id, actor_user_name, api_key_id, api_key_name, api_key_prefix, action, target_type, target_id, before_json, after_json, source, task_id, request_id)
  SELECT actor_user_id, actor_user_name, api_key_id, api_key_name, api_key_prefix, 'update', 'attribution', CAST(NEW.id AS TEXT),
    json_object('id', OLD.id, 'quote_id', OLD.quote_id, 'author_id', OLD.author_id, 'reference_id', OLD.reference_id, 'is_primary', OLD.is_primary, 'status', OLD.status, 'verified_by', OLD.verified_by, 'verified_at', OLD.verified_at, 'notes', OLD.notes, 'created_by', OLD.created_by, 'created_at', OLD.created_at, 'updated_at', OLD.updated_at),
    json_object('id', NEW.id, 'quote_id', NEW.quote_id, 'author_id', NEW.author_id, 'reference_id', NEW.reference_id, 'is_primary', NEW.is_primary, 'status', NEW.status, 'verified_by', NEW.verified_by, 'verified_at', NEW.verified_at, 'notes', NEW.notes, 'created_by', NEW.created_by, 'created_at', NEW.created_at, 'updated_at', NEW.updated_at), source, task_id, request_id
  FROM quote_editorial_audit_context WHERE id = 1;
END;
CREATE TRIGGER quote_editorial_audit_attributions_delete AFTER DELETE ON quote_attributions
WHEN EXISTS (SELECT 1 FROM quote_editorial_audit_context WHERE id = 1)
BEGIN
  INSERT INTO quote_editorial_audit_events (actor_user_id, actor_user_name, api_key_id, api_key_name, api_key_prefix, action, target_type, target_id, before_json, source, task_id, request_id)
  SELECT actor_user_id, actor_user_name, api_key_id, api_key_name, api_key_prefix, 'delete', 'attribution', CAST(OLD.id AS TEXT),
    json_object('id', OLD.id, 'quote_id', OLD.quote_id, 'author_id', OLD.author_id, 'reference_id', OLD.reference_id, 'is_primary', OLD.is_primary, 'status', OLD.status, 'verified_by', OLD.verified_by, 'verified_at', OLD.verified_at, 'notes', OLD.notes, 'created_by', OLD.created_by, 'created_at', OLD.created_at, 'updated_at', OLD.updated_at), source, task_id, request_id
  FROM quote_editorial_audit_context WHERE id = 1;
END;

CREATE TRIGGER quote_editorial_audit_occurrences_insert AFTER INSERT ON quote_occurrences
WHEN EXISTS (SELECT 1 FROM quote_editorial_audit_context WHERE id = 1)
BEGIN
  INSERT INTO quote_editorial_audit_events (actor_user_id, actor_user_name, api_key_id, api_key_name, api_key_prefix, action, target_type, target_id, after_json, source, task_id, request_id)
  SELECT actor_user_id, actor_user_name, api_key_id, api_key_name, api_key_prefix, 'create', 'occurrence', CAST(NEW.id AS TEXT),
    json_object('id', NEW.id, 'quote_id', NEW.quote_id, 'attribution_id', NEW.attribution_id, 'author_id', NEW.author_id, 'reference_id', NEW.reference_id, 'occurrence_type', NEW.occurrence_type, 'occurred_at', NEW.occurred_at, 'date_notes', NEW.date_notes, 'context', NEW.context, 'excerpt', NEW.excerpt, 'notes', NEW.notes, 'created_by', NEW.created_by, 'created_at', NEW.created_at, 'updated_at', NEW.updated_at), source, task_id, request_id
  FROM quote_editorial_audit_context WHERE id = 1;
END;
CREATE TRIGGER quote_editorial_audit_occurrences_update AFTER UPDATE ON quote_occurrences
WHEN EXISTS (SELECT 1 FROM quote_editorial_audit_context WHERE id = 1)
BEGIN
  INSERT INTO quote_editorial_audit_events (actor_user_id, actor_user_name, api_key_id, api_key_name, api_key_prefix, action, target_type, target_id, before_json, after_json, source, task_id, request_id)
  SELECT actor_user_id, actor_user_name, api_key_id, api_key_name, api_key_prefix, 'update', 'occurrence', CAST(NEW.id AS TEXT),
    json_object('id', OLD.id, 'quote_id', OLD.quote_id, 'attribution_id', OLD.attribution_id, 'author_id', OLD.author_id, 'reference_id', OLD.reference_id, 'occurrence_type', OLD.occurrence_type, 'occurred_at', OLD.occurred_at, 'date_notes', OLD.date_notes, 'context', OLD.context, 'excerpt', OLD.excerpt, 'notes', OLD.notes, 'created_by', OLD.created_by, 'created_at', OLD.created_at, 'updated_at', OLD.updated_at),
    json_object('id', NEW.id, 'quote_id', NEW.quote_id, 'attribution_id', NEW.attribution_id, 'author_id', NEW.author_id, 'reference_id', NEW.reference_id, 'occurrence_type', NEW.occurrence_type, 'occurred_at', NEW.occurred_at, 'date_notes', NEW.date_notes, 'context', NEW.context, 'excerpt', NEW.excerpt, 'notes', NEW.notes, 'created_by', NEW.created_by, 'created_at', NEW.created_at, 'updated_at', NEW.updated_at), source, task_id, request_id
  FROM quote_editorial_audit_context WHERE id = 1;
END;
CREATE TRIGGER quote_editorial_audit_occurrences_delete AFTER DELETE ON quote_occurrences
WHEN EXISTS (SELECT 1 FROM quote_editorial_audit_context WHERE id = 1)
BEGIN
  INSERT INTO quote_editorial_audit_events (actor_user_id, actor_user_name, api_key_id, api_key_name, api_key_prefix, action, target_type, target_id, before_json, source, task_id, request_id)
  SELECT actor_user_id, actor_user_name, api_key_id, api_key_name, api_key_prefix, 'delete', 'occurrence', CAST(OLD.id AS TEXT),
    json_object('id', OLD.id, 'quote_id', OLD.quote_id, 'attribution_id', OLD.attribution_id, 'author_id', OLD.author_id, 'reference_id', OLD.reference_id, 'occurrence_type', OLD.occurrence_type, 'occurred_at', OLD.occurred_at, 'date_notes', OLD.date_notes, 'context', OLD.context, 'excerpt', OLD.excerpt, 'notes', OLD.notes, 'created_by', OLD.created_by, 'created_at', OLD.created_at, 'updated_at', OLD.updated_at), source, task_id, request_id
  FROM quote_editorial_audit_context WHERE id = 1;
END;

CREATE TRIGGER quote_editorial_audit_sources_insert AFTER INSERT ON quote_sources
WHEN EXISTS (SELECT 1 FROM quote_editorial_audit_context WHERE id = 1)
BEGIN
  INSERT INTO quote_editorial_audit_events (actor_user_id, actor_user_name, api_key_id, api_key_name, api_key_prefix, action, target_type, target_id, after_json, source, task_id, request_id)
  SELECT actor_user_id, actor_user_name, api_key_id, api_key_name, api_key_prefix, 'create', 'source', CAST(NEW.id AS TEXT),
    json_object('id', NEW.id, 'quote_id', NEW.quote_id, 'attribution_id', NEW.attribution_id, 'occurrence_id', NEW.occurrence_id, 'source_type', NEW.source_type, 'source_url', NEW.source_url, 'label', NEW.label, 'translator_name', NEW.translator_name, 'verification_status', NEW.verification_status, 'verified_by', NEW.verified_by, 'verified_at', NEW.verified_at, 'notes', NEW.notes, 'is_primary', NEW.is_primary, 'created_by', NEW.created_by, 'created_at', NEW.created_at, 'updated_at', NEW.updated_at), source, task_id, request_id
  FROM quote_editorial_audit_context WHERE id = 1;
END;
CREATE TRIGGER quote_editorial_audit_sources_update AFTER UPDATE ON quote_sources
WHEN EXISTS (SELECT 1 FROM quote_editorial_audit_context WHERE id = 1)
BEGIN
  INSERT INTO quote_editorial_audit_events (actor_user_id, actor_user_name, api_key_id, api_key_name, api_key_prefix, action, target_type, target_id, before_json, after_json, source, task_id, request_id)
  SELECT actor_user_id, actor_user_name, api_key_id, api_key_name, api_key_prefix, 'update', 'source', CAST(NEW.id AS TEXT),
    json_object('id', OLD.id, 'quote_id', OLD.quote_id, 'attribution_id', OLD.attribution_id, 'occurrence_id', OLD.occurrence_id, 'source_type', OLD.source_type, 'source_url', OLD.source_url, 'label', OLD.label, 'translator_name', OLD.translator_name, 'verification_status', OLD.verification_status, 'verified_by', OLD.verified_by, 'verified_at', OLD.verified_at, 'notes', OLD.notes, 'is_primary', OLD.is_primary, 'created_by', OLD.created_by, 'created_at', OLD.created_at, 'updated_at', OLD.updated_at),
    json_object('id', NEW.id, 'quote_id', NEW.quote_id, 'attribution_id', NEW.attribution_id, 'occurrence_id', NEW.occurrence_id, 'source_type', NEW.source_type, 'source_url', NEW.source_url, 'label', NEW.label, 'translator_name', NEW.translator_name, 'verification_status', NEW.verification_status, 'verified_by', NEW.verified_by, 'verified_at', NEW.verified_at, 'notes', NEW.notes, 'is_primary', NEW.is_primary, 'created_by', NEW.created_by, 'created_at', NEW.created_at, 'updated_at', NEW.updated_at), source, task_id, request_id
  FROM quote_editorial_audit_context WHERE id = 1;
END;
CREATE TRIGGER quote_editorial_audit_sources_delete AFTER DELETE ON quote_sources
WHEN EXISTS (SELECT 1 FROM quote_editorial_audit_context WHERE id = 1)
BEGIN
  INSERT INTO quote_editorial_audit_events (actor_user_id, actor_user_name, api_key_id, api_key_name, api_key_prefix, action, target_type, target_id, before_json, source, task_id, request_id)
  SELECT actor_user_id, actor_user_name, api_key_id, api_key_name, api_key_prefix, 'delete', 'source', CAST(OLD.id AS TEXT),
    json_object('id', OLD.id, 'quote_id', OLD.quote_id, 'attribution_id', OLD.attribution_id, 'occurrence_id', OLD.occurrence_id, 'source_type', OLD.source_type, 'source_url', OLD.source_url, 'label', OLD.label, 'translator_name', OLD.translator_name, 'verification_status', OLD.verification_status, 'verified_by', OLD.verified_by, 'verified_at', OLD.verified_at, 'notes', OLD.notes, 'is_primary', OLD.is_primary, 'created_by', OLD.created_by, 'created_at', OLD.created_at, 'updated_at', OLD.updated_at), source, task_id, request_id
  FROM quote_editorial_audit_context WHERE id = 1;
END;

-- Preserve existing key behavior during rollout; new agent keys can use narrower scopes.
-- Occurrence scopes are new capabilities and are intentionally not inherited from quote scopes.
UPDATE api_keys SET permissions = json_insert(permissions, '$[#]', 'read:provenance')
WHERE EXISTS (SELECT 1 FROM json_each(permissions) WHERE value = 'read')
  AND NOT EXISTS (SELECT 1 FROM json_each(permissions) WHERE value = 'read:provenance');
UPDATE api_keys SET permissions = json_insert(permissions, '$[#]', 'read:provenance')
WHERE EXISTS (SELECT 1 FROM json_each(permissions) WHERE value = 'write:quotes')
  AND NOT EXISTS (SELECT 1 FROM json_each(permissions) WHERE value = 'read:provenance');
UPDATE api_keys SET permissions = json_insert(permissions, '$[#]', 'write:sources', '$[#]', 'write:attributions', '$[#]', 'assign:authors', '$[#]', 'assign:references')
WHERE EXISTS (SELECT 1 FROM json_each(permissions) WHERE value = 'write:quotes');
UPDATE api_keys SET permissions = json_insert(permissions, '$[#]', 'assign:authors')
WHERE EXISTS (SELECT 1 FROM json_each(permissions) WHERE value = 'delete:authors')
  AND NOT EXISTS (SELECT 1 FROM json_each(permissions) WHERE value = 'assign:authors');
UPDATE api_keys SET permissions = json_insert(permissions, '$[#]', 'assign:references')
WHERE EXISTS (SELECT 1 FROM json_each(permissions) WHERE value = 'delete:references')
  AND NOT EXISTS (SELECT 1 FROM json_each(permissions) WHERE value = 'assign:references');
UPDATE api_keys SET permissions = json_insert(permissions, '$[#]', 'delete:sources', '$[#]', 'delete:attributions')
WHERE EXISTS (SELECT 1 FROM json_each(permissions) WHERE value = 'delete:quotes');
