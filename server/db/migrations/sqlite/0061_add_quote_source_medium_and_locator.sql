ALTER TABLE quote_sources ADD COLUMN source_medium TEXT
  CHECK (source_medium IN ('book', 'web_page', 'transcript', 'audio', 'document', 'other'));

ALTER TABLE quote_sources ADD COLUMN locator_type TEXT
  CHECK (locator_type IN ('page', 'chapter', 'timecode'));

ALTER TABLE quote_sources ADD COLUMN locator_value TEXT;

DROP TRIGGER IF EXISTS quote_editorial_audit_sources_insert;
DROP TRIGGER IF EXISTS quote_editorial_audit_sources_update;
DROP TRIGGER IF EXISTS quote_editorial_audit_sources_delete;

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
