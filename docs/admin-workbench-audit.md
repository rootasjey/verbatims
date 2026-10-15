# Admin Workbench: Feature and Safety Audit

**Audit date:** 2026-10-14

**Scope:** Admin pages linked from `app/layouts/admin.vue`, their in-app data/actions, and closely related admin APIs.
**Method:** Static review of routes, components, API handlers, and schema. No production data, request logs, or feature-usage telemetry were inspected. No admin feature or endpoint was removed or disabled.

## Executive summary

The admin area supports four real product needs: curate/moderate the quote catalogue, operate editorial/publishing workflows, manage accounts/support, and move or maintain application data. Most tools have a distinct domain purpose and should remain available. The main opportunity is to reduce navigation fragmentation by grouping related workflows, not deleting them.

The audit found three areas that were defects or operational hazards before this follow-up:

1. **Import history does not agree with its API contract.** The API returns camelCase import fields while the view renders snake_case export-history fields. Several visible history actions are also explicit TODOs.
2. **Import rollback has an identifier mismatch and unsafe partial-restore behavior.** The view sends an import ID where the endpoint expects a backup-file ID; the endpoint may skip failed rows and still report success.
3. **Database reset does not clear every table in the current schema**, despite being described as a full reset. It is admin-only, but its scope and confirmation need to be made trustworthy before use.

The app-level export is not a duplicate of Cloudflare D1 export: it is a selective Verbatims data export with app history/backups, while Wrangler's D1 export is database-level SQL. Keep both roles distinct. Keep AI theme suggestions available for now as an optional, reviewed aid; the code does not provide enough usage or quality evidence to justify removing it. The manifest-based API/SDK/CLI path is a more reproducible curation mechanism, but does not itself prove the in-admin AI workflow is unused.

**Product decisions recorded during review:** Harvest and Social are needed and should remain. The Sponsors capability is undecided and is deferred to a future product brainstorming session; do not remove it based on this audit.

## Route inventory and recommendation

| Admin route | Current purpose found in code | Recommendation | Confidence |
| --- | --- | --- | --- |
| `/admin` | Staff overview: moderation queue, editorial links, recent activity and counts. | **Keep.** Treat it as a task-oriented entry point; avoid repeating totals already in navigation. | High |
| `/admin/quotes/pending` | Review submissions; approve/reject singly or in bulk, edit metadata and provenance. | **Keep — core moderation.** | High |
| `/admin/quotes/drafts` | Review and edit drafts; bulk edit, submit or delete. | **Keep — core content operations.** Consider grouping with the other quote states rather than removing it. | High |
| `/admin/quotes/published` | Find, edit and bulk-manage approved quotes; unpublish when needed. | **Keep — core catalogue maintenance.** | High |
| `/admin/authors` | Author CRUD, merge, enrichment preview/apply, public-page access. | **Keep.** Merging and correcting catalogue entities protects attribution quality. | High |
| `/admin/references` | Reference CRUD, merge, enrichment preview/apply, public-page access. | **Keep.** Same rationale as authors. | High |
| `/admin/tags` | Tag taxonomy CRUD, color updates, bulk selection and quote-tag backfill. | **Keep.** The backfill is a maintenance tool; retain it behind an explicit operation. | High |
| `/admin/themes` | Curate homepage/editorial themes, translations and filters; activate/default; optional AI naming/suggestions and provider settings. | **Keep the theme editor.** Keep AI optional pending real quality/usage evidence and an explicit deprecation decision. Prefer the manifest workflow for repeatable authored themes. | High |
| `/admin/harvest` | Search supported quote sources, inspect/select candidates, detect duplicates and import candidates. | **Keep — user confirmed it is needed.** Continue monitoring source reliability, terms and duplicate quality. | High |
| `/admin/enrichment` | Configure and process author/reference enrichment jobs; inspect and apply proposed changes. | **Keep if enrichment remains part of editorial operations.** | High |
| `/admin/enrichment-audit` | Audit missing/weak author/reference data and download audit results. | **Keep, but group with Enrichment.** It answers a quality-audit question; the queue applies changes, so these are related rather than duplicates. | High |
| `/admin/social-queue` | Configure supported social providers, design images, manage queued posts, reorder/retry/run/clear items. | **Keep — user confirmed it is needed.** Consider separating provider configuration from queue operations only if the page becomes hard to navigate. | High |
| `/admin/sponsors` | Create, schedule, approve and manage sponsor messages shown within the application. | **Defer.** Revisit prominence and keep/remove decision in a future product brainstorming session; do not remove it now. | High |
| `/admin/messages` | Triage user feedback/reports by status, category and target; bulk status updates. | **Keep — support and moderation inbox.** | High |
| `/admin/users` | Search accounts, create/update roles and account state, bulk or individual deletion. | **Keep — essential account administration.** Preserve strong admin-only guards for destructive/privileged changes. | High |
| `/admin/api-keys` | Manage application API keys, permissions, tiers and rate limits. | **Keep if the public API is supported.** This is distinct from user self-service keys by scope; clarify the distinction in navigation/copy. | High |
| `/admin/import` | Validate and import JSON/CSV/XML/ZIP data, map types, show progress, relink and inspect prior imports/backups. | **Keep, but repair history/rollback before relying on those controls.** Import and restore are operationally high risk. | High |
| `/admin/export` | Selectively export Verbatims entities/data and review export history and associated snapshots. | **Keep.** This is application-level portability/reuse, not a substitute for a D1 database snapshot. | High |
| `/admin/maintenance` | Destructive database reset. | **Keep only as a break-glass capability after correcting scope and safeguards.** Do not present it as an ordinary maintenance action until then. | High |
| `/dashboard` (admin sidebar exit) | Return to the user-facing dashboard. | **Keep.** It is navigation, not an admin feature. | High |

### Related API-only capabilities

- Export backup files are used by export history and import history. The dedicated backup list/statistics/bulk-delete/expired-cleanup handlers have no direct caller found in the `app/` frontend scan. They may be intended for external tooling or future UI; treat them as **orphan candidates, not confirmed dead code** until server/request logs and SDK clients are checked.
- `/api/admin/data-management/export` is explicitly a `410 Gone` compatibility endpoint directing callers to the newer export routes. No frontend caller was found. Retain the response until external callers are ruled out, then remove in a separately approved cleanup.
- Database initialization and some status/progress/OG helpers also have no direct in-app caller found by the scan. Confirm deployment scripts, SDKs, and external automation before pruning any of them.

## Findings requiring attention

### P1 — Import history view/API contract is inconsistent

`server/api/admin/import/list.get.ts` returns fields such as `dataType`, `totalRecords`, `startedAt`, and `completedAt`. `app/components/admin/import/ImportHistory.vue` binds table columns and details to `data_type`, `record_count`, `created_at`, and `completed_at`, and types the rows as `ExportHistoryEntryWithBackup`. Those are export-history fields, not the import API's response shape. As a result, type/count/date details can render blank or incorrectly, and the import identity is conflated with an export/backup shape.

**Status (2026-10-14): fixed.** The history view now uses the import API's camelCase shape, including dates and record counts, and the list endpoint returns a bounded pagination limit plus the number of deletable finished imports.

Evidence: [`ImportHistory.vue`](../app/components/admin/import/ImportHistory.vue), [`list.get.ts`](../server/api/admin/import/list.get.ts), [`export.d.ts`](../shared/types/export.d.ts).

### P1 — Import rollback selects the wrong identifier and can silently partially restore

The history view sets `selectedImport` from an import log row and posts `selectedImport.id` as `backupId`. The list API defines that `id` as `row.import_id`; the backup-list API separately returns backup-file IDs; the rollback endpoint calls `getBackupFileById()` and expects a numeric backup-file ID. The UI does not ask which linked snapshot to restore. Depending on identifier values, rollback can fail to find a backup or target the wrong backup.

The rollback endpoint then deletes tables present in the backup payload, attempts inserts row-by-row, catches and skips individual failures, and still returns `success: true` with “Rollback completed.” That is not a reliable rollback guarantee.

**Status (2026-10-14): made safe by disabling the unsupported operation.** The rollback UI action is gone, and the endpoint now returns `409` after admin authorization. Import payloads are source files or reports, not restorable database snapshots. A future rollback feature needs a separately designed snapshot format and isolated-copy tests.

Evidence: [`ImportHistory.vue`](../app/components/admin/import/ImportHistory.vue), [`backups/[id].get.ts`](../server/api/admin/import/backups/[id].get.ts), [`rollback.post.ts`](../server/api/admin/import/rollback.post.ts).

### P1 — Import-history controls are visible but unimplemented

The Clear All handler only closes the dialog and reloads. Retry and Delete Record handlers only log TODO messages; the import-progress Retry handler is also a TODO. These controls currently promise actions they do not perform.

**Status (2026-10-14): implemented or removed.** Individual and bulk deletion now remove only completed/failed history, delete linked R2 files before their database records, and keep a log entry if its file cleanup fails. Processing/pending imports are not eligible. Retry controls were removed because execution state is memory-only and cannot safely be resumed; the UI directs admins to start a new import from the source file.

Evidence: [`ImportHistory.vue`](../app/components/admin/import/ImportHistory.vue), [`ImportProgress.vue`](../app/components/admin/import/ImportProgress.vue).

### P1 — “Reset database” does not explicitly clear the current schema

The reset handler manually lists 18 tables. The current Drizzle schema defines additional independent tables, including themes/filters/translations, social queue/posts, sponsor messages, API keys/usage, harvest state, enrichment jobs/proposals/history, activity logs, settings, and auth-token tables. Some child tables may be cleared by foreign-key cascades, but the handler does not explicitly cover the full schema and cannot guarantee the UI's stated “all data” semantics. The reset is admin-only, but its confirmation token is a constant embedded in the client, so the real boundary is the authenticated admin role and confirmation UI—not a secret token.

**Status (2026-10-14): scope and implementation corrected; operation not executed.** Reset clears user accounts, user-owned catalogue records, direct interactions, and entity-enrichment state. It preserves schema/configuration, themes, sponsors, harvest and import/export history, general activity logs, and archived import/export files. Those archives may still contain copies of cleared data, so this is not secure erasure. The endpoint now requires explicit `USER_PASSWORD` configuration before mutation, clears/recreates the admin in one `db.batch`, and does not reset sequences for retained operational tables. The UI warning and confirmation match this limited scope. Do not run it against production as part of this review.

Evidence: [`reset-database.post.ts`](../server/api/admin/reset-database.post.ts), [`schema.ts`](../server/db/schema.ts), [`maintenance/index.vue`](../app/pages/admin/maintenance/index.vue).

### P2 — Backup administration has backend surface without a surfaced workflow

Backup list, statistics, bulk-delete, and expired-cleanup endpoints exist, while frontend code uses backup download and linked snapshots but no direct UI caller for the broader management endpoints was found. This may be intentional API-only functionality, but it makes retention/storage operations hard to discover and audit.

**Recommendation:** Decide between (a) a compact “Backups” section under Data Operations with retention/storage status, or (b) explicitly documenting these endpoints as internal-only and confirming external callers. Do not add a second export UI: show backup lifecycle only.

## Product decisions: keep, group, or defer

### Keep

- Quote moderation and catalogue maintenance.
- Author/reference/tag curation and merge operations.
- Theme curation and selective Verbatims export.
- Harvest and Social workflows (user-confirmed needs).
- User administration, support/report inbox, and API-key management where the public API is supported.
- Import/export as separate data portability workflows, once import-history safety defects are fixed.

### Group, without removing capability

The sidebar currently spreads related editorial and operational tasks across “Quotes Management,” “Content Management,” “Development,” and “System Management.” A coherent future grouping could be:

1. **Editorial:** Quotes (Drafts/Pending/Published), Authors, References, Tags, Themes.
2. **Operations:** Harvest, Enrichment (Queue/Audit), Social publishing, Sponsorship messages.
3. **Administration:** Users, Messages, API & Integrations.
4. **Data & maintenance:** Import, Export/Backups, and a separately guarded break-glass reset.

Keep individual routes/bookmarks and role checks intact if navigation is reorganized.

### Defer pending evidence or an explicit product decision

- **Harvest:** Keep; continue checking source reliability/terms, duplicate rate, accepted quote rate, and last use to improve the workflow.
- **Social queue:** Keep; review whether provider configuration and queue controls should be separated only if the page complexity warrants it.
- **Sponsor messages:** Defer the keep/remove and navigation-prominence discussion to a future brainstorming session. Preserve the capability in the meantime.
- **AI theme generation/suggestions:** Keep optional and human-reviewed. Compare accepted/edited/discarded suggestions and failure rates with manually authored manifest themes before deciding whether to retire it. The existing `/api/v1/themes/apply` + SDK/CLI manifest route is the more deterministic authoring path, but it is complementary until the old workflow is explicitly deprecated.
- **Orphan admin endpoints:** Search access logs and deployment/SDK scripts before removal. Repository-only absence is not proof of no external caller.

## What this audit cannot establish

Source code shows capability, guards, and in-repository callers; it does not show which admin tools people actually use, whether external automation calls an endpoint, whether a provider is actively configured in production, or whether AI output is good enough. A usage-based keep/remove decision needs privacy-conscious event counts and outcome signals (for example, last successful run, jobs completed, candidates accepted/rejected, export/import frequency), not assumptions from route names.

This is a product/functionality audit, not a complete penetration test, authorization audit, production-data audit, or browser test of every admin workflow. The initial visual spot-check covered the overview at desktop and the authors table with loaded records at desktop and mobile viewports; it does not certify every admin route or mobile layout.

## Implementation follow-up — 2026-10-14

- The admin layout now uses the dashboard's centered editorial workspace composition: one page identity, primary section tabs, a contextual second row, and horizontally scrollable navigation on narrow screens. All admin destinations remain available, including Harvest, Social, and Sponsors.
- Import history now reflects the actual API contract. Linked file downloads use the API-provided URL; malformed metadata no longer breaks the file list; expired in-memory progress is tolerated.
- Rollback and retry are not represented as working actions. Import source/report archives are explicitly labeled as non-snapshots.
- Individual and bulk cleanup are real, bounded server operations. They target finished imports only. R2 files are removed before import logs; a failure leaves the corresponding log available for a later cleanup attempt. Bulk cleanup may therefore be partial and reports the remaining failures.
- Reset clears user/content tables and their directly tied state only; it preserves operational records and archived export/import files. A configured admin password is required before any destructive statement, and account recreation is part of the same database batch. The reset endpoint was not invoked during this work.
- Verification status: see the implementation handoff for automated checks and the exact browser routes/viewports inspected. No production data or external deployment was changed.

## Suggested order of work

1. Fix/guard the import-history contract and no-op actions; repair rollback as a separately tested destructive workflow.
2. Reconcile database reset semantics with the actual schema and make it explicitly break-glass.
3. Add minimal usage/outcome telemetry or inspect existing operational logs for Harvest, Social, and AI themes; discuss Sponsors separately in a future brainstorming session.
4. Regroup the sidebar without removing route/API compatibility prematurely; preserve Harvest and Social, and revisit Sponsors only after the product discussion.
