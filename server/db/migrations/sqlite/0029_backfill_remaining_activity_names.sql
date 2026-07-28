-- Backfill activity_logs with names for all remaining entity types.
-- The logActivity() calls for authors, references, and some quote types
-- (edited, deleted, unpublished) didn't include the entity name in metadata.

-- Authors
UPDATE activity_logs
SET metadata = json_set(metadata, '$.name', (SELECT name FROM authors WHERE id = target_id))
WHERE type IN ('author_created', 'author_edited', 'author_deleted')
  AND target_type = 'author'
  AND target_id IS NOT NULL
  AND json_extract(metadata, '$.name') IS NULL;

-- References
UPDATE activity_logs
SET metadata = json_set(metadata, '$.name', (SELECT name FROM quote_references WHERE id = target_id))
WHERE type IN ('reference_created', 'reference_edited', 'reference_deleted')
  AND target_type = 'reference'
  AND target_id IS NOT NULL
  AND json_extract(metadata, '$.name') IS NULL;

-- Quote edited, deleted, unpublished (quote_created, quote_submitted, quote_moderated already backfilled in 0027)
UPDATE activity_logs
SET metadata = json_set(metadata, '$.name', (SELECT name FROM quotes WHERE id = target_id))
WHERE type IN ('quote_edited', 'quote_deleted', 'quote_unpublished')
  AND target_type = 'quote'
  AND target_id IS NOT NULL
  AND json_extract(metadata, '$.name') IS NULL;
