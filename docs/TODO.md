# TODO

This file tracks recommended follow-ups to harden the import system and improve reliability on Cloudflare Workers/Pages.

## Import robustness and persistence

- [ ] Persist progress snapshots to D1
  - Add a new table (e.g. `import_progress`) to store: `id`, `status`, `total_records`, `processed_records`, `successful_records`, `failed_records`, `errors (json)`, `warnings (json)`, `started_at`, `completed_at`, `updated_at`.
  - Wire `server/utils/admin-import-progress.ts` to also persist on each `updateAdminImport(...)` (or debounce writes, e.g. every 250–500ms) and to hydrate from D1 if no in-memory entry exists.
  - Update `server/api/admin/import/progress/[id].get.ts` to fallback to D1 when not found in memory.
  - Acceptance: After a Worker cold start, refreshing progress still shows the latest counters; history is accurate in `import_logs` and `import_progress`.

- [ ] Cleanup and retention policy
  - Schedule deletion or archival of `import_progress` rows older than N days (e.g., 30–90).
  - Acceptance: Table size remains bounded; dashboard shows only recent items unless filtered.

## Background execution and uploads

- [ ] Prefer multipart upload for large imports
  - Add a form-data endpoint for “All” imports (e.g., `server/api/admin/import/all-form.post.ts`) that accepts an uploaded ZIP file via `readMultipartFormData(event)`.
  - Parse with `fflate` and reuse existing `parseZipImportEntries`.
  - Acceptance: Files >10MB upload reliably; no base64 inflation; imports start and progress updates appear.

- [ ] Backpressure and batching controls
  - Expose `batchSize` and per-entity sub-batch size in `ImportOptions` (already partially supported) and surface in the UI with sensible defaults.
  - Acceptance: Changing batch size affects throughput without timeouts; no D1 rate-limit errors; failures are retried individually.

## Retry, resume, and backups

- [ ] Implement import retry/requeue
  - Create an endpoint (e.g., `server/api/admin/import/retry.post.ts`) that locates the import’s backup payload (from `backup_files` via R2 path) and re-runs the same import with the original options.
  - Add a “Retry Import” action in `components/admin/import/ImportHistory.vue` and/or the progress UI.
  - Acceptance: A failed import can be re-run without re-upload; progress reflects the new run with a new `import_id`.

- [ ] Confirm R2 bindings and metadata
  - Ensure `uploadBackupFile` configuration is correct on Cloudflare Pages (R2 binding names present in project settings).
  - Acceptance: Backups appear in R2; `ImportHistory` lists available backups linked to each import.

## Observability and safety

- [ ] Improve SSE fallback and heartbeats
  - Current SSE endpoint emits `heartbeat` every 30s. Consider reducing to 15s for UIs behind proxies that time out idle connections.
  - Ensure polling fallback continues smoothly if SSE closes.
  - Acceptance: No progress “freeze” under flaky connections; polling takes over within ~2s.

- [ ] Validation and limits
  - Enforce record-count caps per batch (configurable) and reject malformed input early (size/mime checks for uploads).
  - Acceptance: Large/invalid files are blocked with clear errors; admins see actionable messages.

## Tests

- [ ] Unit tests for parsers and validators
  - Add tests for `parseZipImportEntries`, CSV/XML parsers, and Zod validators (authors, references, quotes, tags).
  - Acceptance: Parsing and validation edge cases covered (empty fields, wrong extensions, malformed JSON/CSV/XML).

- [ ] Integration tests for import endpoints
  - Using Wrangler/Miniflare, cover: start import, progress polling/SSE, completion, failure handling.
  - Acceptance: CI runs Workers-like tests to detect regressions.

## UI / UX

- [ ] Richer progress summaries
  - Show per-entity breakdowns consistently (created vs. updated vs. skipped duplicates with policy reason).
  - Acceptance: Admins can explain outcomes from the UI without opening logs.

- [ ] Cancel/rollback ergonomics
  - Existing cancel endpoint closes progress; add a confirmation and surface any partial completion notes.
  - Add a safer rollback flow gated by a backup snapshot.
  - Acceptance: Cancels are reflected immediately; rollback is available when a suitable backup exists.

## Housekeeping

- [ ] In-memory store TTL
  - Add TTL/cleanup to `adminImportStore` entries after completion to reduce memory use; persist final state to D1.
  - Acceptance: Memory usage bounded; history remains queryable from D1.

- [ ] Documentation
  - Document import formats, limits, and admin options in `docs/`.
  - Acceptance: Contributors can run imports locally and on Pages with minimal friction.


- [ ] Avoid mutating computed data objects
  - Refactor places where we directly mutate data coming from useFetch/useLazyFetch computed wrappers (e.g., likes_count, shares_count, views_count on quote/author/reference pages).
  - Prefer local refs mirroring server data or re-fetch and replace the response (e.g., `fooData.value = await $fetch(...)`).
  - Audit: pages/quotes/[id].vue, pages/authors/[id].vue, pages/references/[id].vue.
