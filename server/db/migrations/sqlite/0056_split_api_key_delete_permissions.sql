-- Preserve existing destructive access while allowing new keys to separate it.
UPDATE api_keys
SET permissions = json_insert(permissions, '$[#]', 'delete:quotes')
WHERE EXISTS (SELECT 1 FROM json_each(api_keys.permissions) WHERE value = 'write:quotes')
  AND NOT EXISTS (SELECT 1 FROM json_each(api_keys.permissions) WHERE value = 'delete:quotes');

UPDATE api_keys
SET permissions = json_insert(permissions, '$[#]', 'delete:authors')
WHERE EXISTS (SELECT 1 FROM json_each(api_keys.permissions) WHERE value = 'write:authors')
  AND NOT EXISTS (SELECT 1 FROM json_each(api_keys.permissions) WHERE value = 'delete:authors');

UPDATE api_keys
SET permissions = json_insert(permissions, '$[#]', 'delete:references')
WHERE EXISTS (SELECT 1 FROM json_each(api_keys.permissions) WHERE value = 'write:references')
  AND NOT EXISTS (SELECT 1 FROM json_each(api_keys.permissions) WHERE value = 'delete:references');

UPDATE api_keys
SET permissions = json_insert(permissions, '$[#]', 'delete:collections')
WHERE EXISTS (SELECT 1 FROM json_each(api_keys.permissions) WHERE value = 'write:collections')
  AND NOT EXISTS (SELECT 1 FROM json_each(api_keys.permissions) WHERE value = 'delete:collections');

UPDATE api_keys
SET permissions = json_insert(permissions, '$[#]', 'social:delete')
WHERE EXISTS (SELECT 1 FROM json_each(api_keys.permissions) WHERE value = 'social:write')
  AND NOT EXISTS (SELECT 1 FROM json_each(api_keys.permissions) WHERE value = 'social:delete');

UPDATE api_keys
SET permissions = json_insert(permissions, '$[#]', 'delete:themes')
WHERE EXISTS (SELECT 1 FROM json_each(api_keys.permissions) WHERE value = 'admin:themes')
  AND NOT EXISTS (SELECT 1 FROM json_each(api_keys.permissions) WHERE value = 'delete:themes');
