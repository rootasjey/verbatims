INSERT INTO activity_logs (type, user_id, target_id, target_type, metadata, source, created_at)
SELECT 'quote_created', user_id, id, 'quote',
  json_object('status', status, 'name', name),
  'web', COALESCE(created_at, unixepoch())
FROM quotes
WHERE id NOT IN (SELECT target_id FROM activity_logs WHERE type = 'quote_created' AND target_type = 'quote');

INSERT INTO activity_logs (type, user_id, target_id, target_type, metadata, source, created_at)
SELECT 'quote_moderated', moderator_id, id, 'quote',
  json_object('new_status', status, 'action', CASE WHEN status = 'approved' THEN 'approve' ELSE 'reject' END),
  'web', moderated_at
FROM quotes
WHERE moderator_id IS NOT NULL AND moderated_at IS NOT NULL
  AND id NOT IN (SELECT target_id FROM activity_logs WHERE type = 'quote_moderated' AND target_type = 'quote');

INSERT INTO activity_logs (type, user_id, target_id, target_type, metadata, source, created_at)
SELECT 'user_registered', id, id, 'user',
  json_object('name', name, 'role', role),
  'web', COALESCE(created_at, unixepoch())
FROM users
WHERE id NOT IN (SELECT target_id FROM activity_logs WHERE type = 'user_registered' AND target_type = 'user');
