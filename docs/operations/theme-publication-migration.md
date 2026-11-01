# Theme publication migration

Migration `0053_add_theme_publication_status.sql` adds an independent publication state and social-announcement switch to `themes`. Existing themes are backfilled as published, and their current `is_active` value is copied to `social_is_active`. New rows default to draft and socially inactive.

## Production procedure

The additive migration was applied to production D1 on 2026-10-31, immediately before deploying the application change. The old application remained compatible with the added columns during the migration interval.

1. Confirm the target is the `verbatims` D1 database and take a D1 Time Travel bookmark. **Completed:** bookmark captured immediately before the production migration.
2. Record the preflight counts and confirm the current table has the expected 27 columns. **Completed:** 27 columns; 14 rows total, 5 active.

   ```sql
   PRAGMA table_info(themes);
   SELECT COUNT(*) AS total,
          SUM(CASE WHEN COALESCE(is_active, 0) = 1 THEN 1 ELSE 0 END) AS active
   FROM themes;
   ```

3. Apply `server/db/migrations/sqlite/0053_add_theme_publication_status.sql` once with the approved production migration workflow. **Completed:** both columns, compatibility backfill, and index applied.
4. Verify the two new columns, the publication index, unchanged row count, and compatibility backfill. **Completed:** 29 columns; publication index present; all 14 rows published; counts remain 14 total / 5 active; all 5 previously active themes are socially active, with 0 mismatches.

   ```sql
   PRAGMA table_info(themes);
   PRAGMA index_list(themes);
   SELECT publication_status, COUNT(*) AS total FROM themes GROUP BY publication_status;
   SELECT COUNT(*) AS total,
          SUM(CASE WHEN COALESCE(is_active, 0) = 1 THEN 1 ELSE 0 END) AS active,
          SUM(CASE WHEN social_is_active = 1 THEN 1 ELSE 0 END) AS social_active
   FROM themes;
   ```

   Existing rows must all be `published`; the `total` and `active` values must match preflight, and `social_active` must equal the preflight `active` value. Confirm a newly inserted theme in the approved non-production check environment defaults to `draft` and `social_is_active = 0`.
5. If any check disagrees, stop before creating November drafts. Preserve the bookmark and investigate; do not compensate with ad hoc updates.

Production checks used the Cloudflare D1 dashboard session on 2026-10-31. No theme rows were created or manually activated/published as part of the migration.

## Homepage-selection field naming

Migration `0054_add_home_is_active_alias.sql` adds `home_is_active`, backfills it from `is_active`, and installs triggers to keep both columns synchronized while old Worker versions remain active. The application and API use `homeIsActive` / `home_is_active`; API writes still accept `isActive` / `is_active`, and responses retain those deprecated aliases for existing clients.

Before applying 0054 in production, verify that the previous Cloudflare build is `Ready` and no new build is in progress. Take a D1 Time Travel bookmark immediately before the migration. Preflight should show 29 columns, 14 themes, and 5 rows with `is_active = 1`. Apply the migration once, then verify 30 columns, the `idx_themes_home_active` index, all 14 rows retained, and zero mismatches between `home_is_active` and `COALESCE(is_active, 0)`. Check that the three synchronization triggers exist before pushing the application code. The old Worker remains compatible throughout this rollout because the old column is retained and mirrored.

Migration 0054 was applied to production D1 on 2026-11-01 after confirming the latest Cloudflare deployment was `Ready` with no build in progress. Preflight showed 29 columns and 14 themes, including 5 active rows. The immediate pre-migration Time Travel bookmark was `000063e7-00000000-00005115-12c35e573e3e154c95c000d180fe757d`. Postflight showed 30 columns, the index and all three triggers, 14 themes, 5 rows selected for homepage fallback, and 0 legacy/new-field mismatches. Social-active and publication-status values were unchanged. No theme rows were manually created, activated, or published.

Do not remove the legacy `is_active` column in this rollout. A later physical removal needs its own isolated D1 rehearsal and foreign-key/cascade audit because dependent theme tables reference `themes`.

## Physical removal of the legacy column

Migration `0055_remove_theme_is_active_legacy.sql` is the proposed physical removal. The code now reads and writes only `home_is_active`; it continues to accept and return `is_active` as a deprecated API alias derived from the canonical field. The legacy Drizzle mapping and storage dual-writes are removed. No production migration has been applied for 0055.

The production D1 audit after 0054 found these dependent rows: 14 themes, 285 content filters, 10 translations, 331 enrichment jobs, 7 suggestions, and no user messages with a theme. Foreign-key checks were clean. `theme_content_filters`, `theme_translations`, `theme_enrichment_jobs`, and `entity_suggestions` reference themes with `ON DELETE CASCADE`; `user_messages.theme_id` uses `ON DELETE SET NULL`. Suggestions also reference enrichment jobs with `ON DELETE SET NULL`. Rebuilding only `themes` would therefore lose child data.

Rehearsal results:

- A disposable copy of the local application database retained identical rows across themes (14), filters (285), translations (10), enrichment jobs (330), suggestions (7), and user messages (5). The local copy has one fewer enrichment job than the production audit, so its results do not replace the production preflight. `PRAGMA foreign_key_check` returned no rows; a temporary theme deletion exercised all four cascade paths and the user-message `SET NULL` path.
- The isolated `verbatims_preview` D1 database had no theme tables before rehearsal. It was initialized with synthetic fixtures (14 themes, 3 filters, 2 translations, 2 jobs, 2 suggestions, and 1 linked message), then 0055 was executed against D1. The legacy column and sync triggers were gone; all fixture rows remained, foreign keys were valid, and a temporary delete confirmed the cascade and `SET NULL` behavior. The synthetic fixture rows were removed afterward. Preview now has the 0055 schema and empty theme tables.

### Production procedure for joint review

1. Deploy the code-only cleanup first and confirm its exact Git commit is the active, ready Worker. This ensures the live application has no dependency on the physical column before removal.
2. Immediately before the D1 change, take a Time Travel bookmark and record row counts, ID ranges, `sqlite_sequence`, `PRAGMA foreign_key_check`, child foreign-key definitions, and index/trigger definitions for all six affected tables.
3. Apply 0055 once during a reviewed maintenance window. Do not run the migration if any preflight value differs from the recorded audit without first updating and reviewing the plan.
4. Verify all row values and IDs are preserved, `is_active` and alias-sync triggers are absent, canonical indexes and all child indexes exist, foreign keys point to the replacement tables with their original delete actions, sequence high-water marks are not lower, and `PRAGMA foreign_key_check` is empty.
5. Confirm admin/API theme reads and writes, theme fallback selection, and one controlled create/update/delete cycle before closing the change. The production migration remains pending joint validation of this procedure.

### Wrangler migration-tracker discrepancy

Read-only inspection on 2026-11-01 confirmed that production already has the 0053 and 0054 schema changes, but Wrangler's `d1_migrations` table only records through `0052_make_occurrence_attribution_optional.sql`. Accordingly, `wrangler d1 migrations list DB --remote` reports 0053, 0054, and 0055 as pending even though 0053/0054 are present in the schema. Do not run `wrangler d1 migrations apply` in this state: it would attempt to replay 0053/0054 before reaching 0055. No production registry changes have been made.

After the joint review, reconcile the tracker only after rechecking the 0053/0054 columns and indexes. The proposed metadata-only reconciliation is to insert these exact filenames into `d1_migrations` (whose `applied_at` has a current-time default), in order, then rerun `wrangler d1 migrations list` and confirm that only 0055 remains pending:

```sql
INSERT INTO d1_migrations (name) VALUES ('0053_add_theme_publication_status.sql');
INSERT INTO d1_migrations (name) VALUES ('0054_add_home_is_active_alias.sql');
```

These inserts have not been run. Then, immediately before the approved production migration, retrieve and save a fresh current Time Travel bookmark; the bookmark read during the 2026-11-01 audit is not the final migration checkpoint.
