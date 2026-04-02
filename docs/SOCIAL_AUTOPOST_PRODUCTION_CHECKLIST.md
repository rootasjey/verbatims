# Social Autopost Production Checklist

Use this checklist when deploying the social autopost migration that introduces source_type and source_id and moves shared logic to @verbatims/social-autopost-core.

## 1. Pre-deploy backup

- Capture the current KV payload for social provider settings under social:providers:config:v1.
- Capture the current KV payload for Meta credentials under social:meta:credentials:v1.
- Export or snapshot the current D1 tables social_queue and social_posts before applying migrations.

## 2. Rollout order

- Apply the D1 migration first.
- Verify the new columns exist on social_queue and social_posts before deploying application code.
- Deploy the Worker and Nuxt code only after the database schema is live.

## 3. Database smoke checks

Run these checks after the migration and before enabling traffic:

```sql
SELECT COUNT(*) AS queue_rows FROM social_queue;
SELECT COUNT(*) AS queue_missing_source_refs
FROM social_queue
WHERE source_type IS NULL OR source_id IS NULL;

SELECT COUNT(*) AS post_rows FROM social_posts;
SELECT COUNT(*) AS posts_missing_source_refs
FROM social_posts
WHERE source_type IS NULL OR source_id IS NULL;

SELECT COUNT(*) AS queue_backfill_mismatches
FROM social_queue
WHERE source_type = 'quote' AND source_id != quote_id;

SELECT COUNT(*) AS post_backfill_mismatches
FROM social_posts
WHERE source_type = 'quote' AND source_id != quote_id;
```

Expected result: all mismatch or missing-source counts should be 0 for historical quote-based data.

## 4. Admin UI smoke checks

- Open the admin social queue page for at least X, Bluesky, Instagram, and Facebook.
- Confirm the queue list loads without SQL or serialization errors.
- Confirm already scheduled items still render content, author, reference, and the source link.
- Confirm search works for an existing queued quote by quote text or author.
- Confirm clear finished and clear all still return a success response for a non-production-safe test case.

## 5. Provider configuration checks

- Open each configured provider dialog and confirm existing values are still resolved from KV or env as expected.
- Save one provider form without changing any secret fields and confirm no credentials disappear.
- Confirm Facebook, Instagram, Threads, and Bluesky still report the expected source labels and connection state.
- If using env fallback for some fields, verify that clearing a field in the UI really falls back to env or default rather than leaving stale KV state.

## 6. Execution checks

- Trigger Run now on a safe queued quote for one provider at a time.
- Confirm the queue item moves from queued to processing to posted or failed with a clear reason.
- Confirm new rows written to social_posts include source_type and source_id.
- Confirm the generated post URL or external ID still appears in the admin queue.

## 7. Post-deploy monitoring

- Watch Worker logs for queries failing on source_type or source_id.
- Watch for provider authentication failures that could indicate lost KV credentials.
- Check that the next cron execution picks up one queued item per enabled provider as expected.

## 8. Rollback trigger

Rollback immediately if any of these occur:

- admin social queue page fails to load
- queue migration leaves missing or mismatched source references
- provider credentials disappear after opening or saving config dialogs
- run-now writes malformed social_posts rows or fails before queue claim completion