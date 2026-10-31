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
