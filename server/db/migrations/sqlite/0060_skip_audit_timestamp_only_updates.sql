-- Ignore timestamp-only writes from the existing updated_at maintenance triggers.
DROP TRIGGER IF EXISTS quote_editorial_audit_authors_update;
CREATE TRIGGER quote_editorial_audit_authors_update AFTER UPDATE ON authors
WHEN EXISTS (SELECT 1 FROM quote_editorial_audit_context WHERE id = 1)
  AND (
    OLD.id IS NOT NEW.id
    OR OLD.name IS NOT NEW.name
    OR OLD.is_fictional IS NOT NEW.is_fictional
    OR OLD.birth_date IS NOT NEW.birth_date
    OR OLD.birth_year IS NOT NEW.birth_year
    OR OLD.birth_era IS NOT NEW.birth_era
    OR OLD.birth_month IS NOT NEW.birth_month
    OR OLD.birth_day IS NOT NEW.birth_day
    OR OLD.birth_is_approximate IS NOT NEW.birth_is_approximate
    OR OLD.birth_calendar IS NOT NEW.birth_calendar
    OR OLD.birth_location IS NOT NEW.birth_location
    OR OLD.death_date IS NOT NEW.death_date
    OR OLD.death_year IS NOT NEW.death_year
    OR OLD.death_era IS NOT NEW.death_era
    OR OLD.death_month IS NOT NEW.death_month
    OR OLD.death_day IS NOT NEW.death_day
    OR OLD.death_is_approximate IS NOT NEW.death_is_approximate
    OR OLD.death_calendar IS NOT NEW.death_calendar
    OR OLD.death_location IS NOT NEW.death_location
    OR OLD.job IS NOT NEW.job
    OR OLD.description IS NOT NEW.description
    OR OLD.image_url IS NOT NEW.image_url
    OR OLD.image_alt IS NOT NEW.image_alt
    OR OLD.image_credit IS NOT NEW.image_credit
    OR OLD.image_credit_status IS NOT NEW.image_credit_status
    OR OLD.image_source_url IS NOT NEW.image_source_url
    OR OLD.image_license IS NOT NEW.image_license
    OR OLD.image_license_status IS NOT NEW.image_license_status
    OR OLD.image_date IS NOT NEW.image_date
    OR OLD.image_location IS NOT NEW.image_location
    OR OLD.socials IS NOT NEW.socials
  )
BEGIN
  INSERT INTO quote_editorial_audit_events (actor_user_id, actor_user_name, api_key_id, api_key_name, api_key_prefix, action, target_type, target_id, before_json, after_json, source, task_id, request_id)
  SELECT actor_user_id, actor_user_name, api_key_id, api_key_name, api_key_prefix, 'update', 'author', CAST(NEW.id AS TEXT),
    json_object('id', OLD.id, 'name', OLD.name, 'is_fictional', OLD.is_fictional, 'birth_date', OLD.birth_date, 'birth_year', OLD.birth_year, 'birth_era', OLD.birth_era, 'birth_month', OLD.birth_month, 'birth_day', OLD.birth_day, 'birth_is_approximate', OLD.birth_is_approximate, 'birth_calendar', OLD.birth_calendar, 'birth_location', OLD.birth_location, 'death_date', OLD.death_date, 'death_year', OLD.death_year, 'death_era', OLD.death_era, 'death_month', OLD.death_month, 'death_day', OLD.death_day, 'death_is_approximate', OLD.death_is_approximate, 'death_calendar', OLD.death_calendar, 'death_location', OLD.death_location, 'job', OLD.job, 'description', OLD.description, 'image_url', OLD.image_url, 'image_alt', OLD.image_alt, 'image_credit', OLD.image_credit, 'image_credit_status', OLD.image_credit_status, 'image_source_url', OLD.image_source_url, 'image_license', OLD.image_license, 'image_license_status', OLD.image_license_status, 'image_date', OLD.image_date, 'image_location', OLD.image_location, 'socials', OLD.socials, 'updated_at', OLD.updated_at ),
    json_object('id', NEW.id, 'name', NEW.name, 'is_fictional', NEW.is_fictional, 'birth_date', NEW.birth_date, 'birth_year', NEW.birth_year, 'birth_era', NEW.birth_era, 'birth_month', NEW.birth_month, 'birth_day', NEW.birth_day, 'birth_is_approximate', NEW.birth_is_approximate, 'birth_calendar', NEW.birth_calendar, 'birth_location', NEW.birth_location, 'death_date', NEW.death_date, 'death_year', NEW.death_year, 'death_era', NEW.death_era, 'death_month', NEW.death_month, 'death_day', NEW.death_day, 'death_is_approximate', NEW.death_is_approximate, 'death_calendar', NEW.death_calendar, 'death_location', NEW.death_location, 'job', NEW.job, 'description', NEW.description, 'image_url', NEW.image_url, 'image_alt', NEW.image_alt, 'image_credit', NEW.image_credit, 'image_credit_status', NEW.image_credit_status, 'image_source_url', NEW.image_source_url, 'image_license', NEW.image_license, 'image_license_status', NEW.image_license_status, 'image_date', NEW.image_date, 'image_location', NEW.image_location, 'socials', NEW.socials, 'updated_at', NEW.updated_at ), source, task_id, request_id
  FROM quote_editorial_audit_context WHERE id = 1;
END;

DROP TRIGGER IF EXISTS quote_editorial_audit_quote_references_update;
CREATE TRIGGER quote_editorial_audit_quote_references_update AFTER UPDATE ON quote_references
WHEN EXISTS (SELECT 1 FROM quote_editorial_audit_context WHERE id = 1)
  AND (
    OLD.id IS NOT NEW.id
    OR OLD.name IS NOT NEW.name
    OR OLD.original_language IS NOT NEW.original_language
    OR OLD.release_date IS NOT NEW.release_date
    OR OLD.description IS NOT NEW.description
    OR OLD.primary_type IS NOT NEW.primary_type
    OR OLD.secondary_type IS NOT NEW.secondary_type
    OR OLD.image_url IS NOT NEW.image_url
    OR OLD.image_alt IS NOT NEW.image_alt
    OR OLD.image_credit IS NOT NEW.image_credit
    OR OLD.image_credit_status IS NOT NEW.image_credit_status
    OR OLD.image_source_url IS NOT NEW.image_source_url
    OR OLD.image_license IS NOT NEW.image_license
    OR OLD.image_license_status IS NOT NEW.image_license_status
    OR OLD.image_date IS NOT NEW.image_date
    OR OLD.image_location IS NOT NEW.image_location
    OR OLD.urls IS NOT NEW.urls
  )
BEGIN
  INSERT INTO quote_editorial_audit_events (actor_user_id, actor_user_name, api_key_id, api_key_name, api_key_prefix, action, target_type, target_id, before_json, after_json, source, task_id, request_id)
  SELECT actor_user_id, actor_user_name, api_key_id, api_key_name, api_key_prefix, 'update', 'reference', CAST(NEW.id AS TEXT),
    json_object('id', OLD.id, 'name', OLD.name, 'original_language', OLD.original_language, 'release_date', OLD.release_date, 'description', OLD.description, 'primary_type', OLD.primary_type, 'secondary_type', OLD.secondary_type, 'image_url', OLD.image_url, 'image_alt', OLD.image_alt, 'image_credit', OLD.image_credit, 'image_credit_status', OLD.image_credit_status, 'image_source_url', OLD.image_source_url, 'image_license', OLD.image_license, 'image_license_status', OLD.image_license_status, 'image_date', OLD.image_date, 'image_location', OLD.image_location, 'urls', OLD.urls, 'updated_at', OLD.updated_at ),
    json_object('id', NEW.id, 'name', NEW.name, 'original_language', NEW.original_language, 'release_date', NEW.release_date, 'description', NEW.description, 'primary_type', NEW.primary_type, 'secondary_type', NEW.secondary_type, 'image_url', NEW.image_url, 'image_alt', NEW.image_alt, 'image_credit', NEW.image_credit, 'image_credit_status', NEW.image_credit_status, 'image_source_url', NEW.image_source_url, 'image_license', NEW.image_license, 'image_license_status', NEW.image_license_status, 'image_date', NEW.image_date, 'image_location', NEW.image_location, 'urls', NEW.urls, 'updated_at', NEW.updated_at ), source, task_id, request_id
  FROM quote_editorial_audit_context WHERE id = 1;
END;
