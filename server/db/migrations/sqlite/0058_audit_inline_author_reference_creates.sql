CREATE TRIGGER quote_editorial_audit_authors_insert AFTER INSERT ON authors
WHEN EXISTS (SELECT 1 FROM quote_editorial_audit_context WHERE id = 1)
BEGIN
  INSERT INTO quote_editorial_audit_events (actor_user_id, actor_user_name, api_key_id, api_key_name, api_key_prefix, action, target_type, target_id, after_json, source, task_id, request_id)
  SELECT actor_user_id, actor_user_name, api_key_id, api_key_name, api_key_prefix, 'create', 'author', CAST(NEW.id AS TEXT),
    json_object('id', NEW.id, 'name', NEW.name, 'is_fictional', NEW.is_fictional, 'birth_date', NEW.birth_date, 'birth_year', NEW.birth_year, 'birth_era', NEW.birth_era, 'birth_month', NEW.birth_month, 'birth_day', NEW.birth_day, 'birth_is_approximate', NEW.birth_is_approximate, 'birth_calendar', NEW.birth_calendar, 'birth_location', NEW.birth_location, 'death_date', NEW.death_date, 'death_year', NEW.death_year, 'death_era', NEW.death_era, 'death_month', NEW.death_month, 'death_day', NEW.death_day, 'death_is_approximate', NEW.death_is_approximate, 'death_calendar', NEW.death_calendar, 'death_location', NEW.death_location, 'job', NEW.job, 'description', NEW.description, 'image_url', NEW.image_url, 'image_alt', NEW.image_alt, 'image_credit', NEW.image_credit, 'image_credit_status', NEW.image_credit_status, 'image_source_url', NEW.image_source_url, 'image_license', NEW.image_license, 'image_license_status', NEW.image_license_status, 'image_date', NEW.image_date, 'image_location', NEW.image_location, 'socials', NEW.socials, 'views_count', NEW.views_count, 'likes_count', NEW.likes_count, 'shares_count', NEW.shares_count, 'created_at', NEW.created_at, 'updated_at', NEW.updated_at), source, task_id, request_id
  FROM quote_editorial_audit_context WHERE id = 1;
END;

CREATE TRIGGER quote_editorial_audit_references_insert AFTER INSERT ON quote_references
WHEN EXISTS (SELECT 1 FROM quote_editorial_audit_context WHERE id = 1)
BEGIN
  INSERT INTO quote_editorial_audit_events (actor_user_id, actor_user_name, api_key_id, api_key_name, api_key_prefix, action, target_type, target_id, after_json, source, task_id, request_id)
  SELECT actor_user_id, actor_user_name, api_key_id, api_key_name, api_key_prefix, 'create', 'reference', CAST(NEW.id AS TEXT),
    json_object('id', NEW.id, 'name', NEW.name, 'original_language', NEW.original_language, 'release_date', NEW.release_date, 'description', NEW.description, 'primary_type', NEW.primary_type, 'secondary_type', NEW.secondary_type, 'image_url', NEW.image_url, 'image_alt', NEW.image_alt, 'image_credit', NEW.image_credit, 'image_credit_status', NEW.image_credit_status, 'image_source_url', NEW.image_source_url, 'image_license', NEW.image_license, 'image_license_status', NEW.image_license_status, 'image_date', NEW.image_date, 'image_location', NEW.image_location, 'urls', NEW.urls, 'views_count', NEW.views_count, 'likes_count', NEW.likes_count, 'shares_count', NEW.shares_count, 'created_at', NEW.created_at, 'updated_at', NEW.updated_at), source, task_id, request_id
  FROM quote_editorial_audit_context WHERE id = 1;
END;
