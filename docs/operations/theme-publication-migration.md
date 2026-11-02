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

Migration 0054 retained the legacy `is_active` column during its compatibility rollout. Its physical removal is now complete as documented below.

## Physical removal of the legacy column

Migration `0055_remove_theme_is_active_legacy.sql` removes the physical column. It was applied to production D1 on 2026-11-02 after the code-only cleanup had been deployed. The code reads and writes only `home_is_active`; it continues to accept and return `is_active` as a deprecated API alias derived from the canonical field. The legacy Drizzle mapping and storage dual-writes are removed.

The production D1 audit after 0054 found these dependent rows: 14 themes, 285 content filters, 10 translations, 331 enrichment jobs, 7 suggestions, and no user messages with a theme. Foreign-key checks were clean. `theme_content_filters`, `theme_translations`, `theme_enrichment_jobs`, and `entity_suggestions` reference themes with `ON DELETE CASCADE`; `user_messages.theme_id` uses `ON DELETE SET NULL`. Suggestions also reference enrichment jobs with `ON DELETE SET NULL`. Rebuilding only `themes` would therefore lose child data.

Rehearsal results:

- A disposable copy of the local application database retained identical rows across themes (14), filters (285), translations (10), enrichment jobs (330), suggestions (7), and user messages (5). The local copy has one fewer enrichment job than the production audit, so its results do not replace the production preflight. `PRAGMA foreign_key_check` returned no rows; a temporary theme deletion exercised all four cascade paths and the user-message `SET NULL` path.
- The isolated `verbatims_preview` D1 database had no theme tables before rehearsal. It was initialized with synthetic fixtures (14 themes, 3 filters, 2 translations, 2 jobs, 2 suggestions, and 1 linked message), then 0055 was executed against D1. The legacy column and sync triggers were gone; all fixture rows remained, foreign keys were valid, and a temporary delete confirmed the cascade and `SET NULL` behavior. The synthetic fixture rows were removed afterward. Preview now has the 0055 schema and empty theme tables.

### Production procedure and results

1. Commit `edff613935e6082d10aec9e596fd3d597cc80359` (`v1.55.1`) was pushed to `main`; CI passed. Worker version `5ffd2f13-36ab-4cb1-a515-e9f942031a5e` served 100% of traffic, and `/_openapi.json` reported `1.55.1` before the database change.
2. The fresh pre-migration Time Travel bookmark was `0000660a-00000008-00005117-9106d67b9bda71f3d793d868b17f1bc1`. Preflight found 14 themes, 285 content filters, 10 translations, 331 enrichment jobs, 7 suggestions, and 5 user messages (none linked to a theme). All 14 themes were published; 5 were selected for homepage fallback and 5 were socially active. `home_is_active` matched `COALESCE(is_active, 0)` for all rows. `PRAGMA foreign_key_check` returned no rows.
3. Wrangler's migration tracker was reconciled after confirming the 0053/0054 schema effects. The existing rows for 0053 and 0054 were recorded at 2026-11-02 10:06:45 UTC; `wrangler d1 migrations list` then showed only 0055 pending. Wrangler applied 0055 at 10:07:13 UTC.
4. Pre/post SHA-256 comparisons matched for every row in `theme_content_filters`, `theme_translations`, `theme_enrichment_jobs`, `entity_suggestions`, and `user_messages`. The themes comparison also matched after projecting the removed `is_active` field from `home_is_active` (the preflight had zero mismatches). Counts, ID ranges, and `sqlite_sequence` high-water marks were preserved: themes 49, filters 770, translations 13, enrichment jobs 340, suggestions 7, and user messages 5.
5. Postflight found no `is_active` column, legacy index, or sync triggers. Canonical and child indexes remained; all child foreign keys point to `themes` with their original delete actions, and `PRAGMA foreign_key_check` returned no rows. The post-migration public homepage selected “La nuit d’Halloween” as its fallback theme. The production admin page had shown all 14 themes before migration; the Ego session had expired by the post-migration check, so a post-migration authenticated admin/API write check was not performed. Create/update/delete behavior was rehearsed on the isolated Preview database. D1 rejected `PRAGMA integrity_check` with `SQLITE_AUTH`, so that pragma could not be used remotely.

### Wrangler migration-tracker discrepancy

Read-only inspection on 2026-11-01 found that production had the 0053 and 0054 schema changes, while Wrangler's `d1_migrations` table recorded only through 0052. Running `wrangler d1 migrations apply` before reconciling this discrepancy would have replayed 0053/0054. The tracker has since been reconciled after verifying their schema effects:

```sql
INSERT INTO d1_migrations (name) VALUES ('0053_add_theme_publication_status.sql');
INSERT INTO d1_migrations (name) VALUES ('0054_add_home_is_active_alias.sql');
```

Both entries were inserted on 2026-11-02 at 10:06:45 UTC. Wrangler then reported only 0055 pending, and the migration tracker records 0055 as applied at 10:07:13 UTC. The bookmark above is the pre-migration recovery point.
