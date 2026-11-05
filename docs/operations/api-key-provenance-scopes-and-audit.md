# API key provenance scopes and editorial audit

## Scope model

New keys can grant provenance access independently from quote text access:

| Scope | Access |
| --- | --- |
| `read:provenance` | Read attribution and source fields in quote responses, plus dedicated attribution, source, and occurrence endpoints |
| `write:quotes` / `delete:quotes` | Create or edit quote text / delete a quote |
| `write:sources` / `delete:sources` | Create or edit / delete source records |
| `write:occurrences` / `delete:occurrences` | Create or edit / delete occurrence records |
| `write:attributions` / `delete:attributions` | Edit attribution metadata / delete non-primary attributions |
| `assign:authors` | Set an author on an attribution or occurrence |
| `assign:references` | Set a reference on an attribution or occurrence |

Attribution mutations still require a moderator or admin account. A researcher key can be limited to quote/source/occurrence work and attribution notes/status, while omitting deletion and both assignment scopes. To create or replace an attribution with an author or reference, the key needs `write:attributions` and the matching assignment scope. Creating an author or reference inline also requires its `write:*` scope and a moderator/admin account, and the creation is recorded in the editorial audit. Existing keys are upgraded by migration 0057 to preserve their effective prior access: `read` and legacy `write:quotes` receive provenance read; `write:quotes` receives the old source/attribution write and author/reference assignment powers; `delete:quotes` receives the old source/attribution deletion powers; `delete:authors` and `delete:references` receive the matching assignment scope needed by their existing anonymize strategy. Occurrence write/delete scopes are new capabilities and are not inherited from old quote scopes.

Only approved quotes are readable through provenance endpoints for ordinary API keys. Moderator/admin keys with `read:provenance` may also inspect non-approved quotes. Every quote response that includes authors, references, attributions, or sources omits those fields unless the key has `read:provenance` (or `*`), including search, random, collections, and mutation responses.

## Editorial audit

Migrations 0057 and 0058 add `quote_editorial_audit_events`, separate from `api_key_usage_logs`. Triggers capture the actual before/after row values, generated target ID, action, actor user ID and account name, API key ID, key name and safe prefix, source, and request/task identifiers. Inline author/reference creation is captured alongside quote provenance changes, including bulk edits and imports. The API key value and hash are never recorded. The API mutation, audit events, and short-lived audit context are one D1 batch; failure of any statement rolls back the whole batch.

Events have no foreign keys to users or API keys so revocation or account deletion does not remove history. SQLite triggers reject event updates and deletes. The application exposes only a read-only admin endpoint at `GET /api/admin/quote-editorial-audit?limit=50&order=newest&before_id=123`; use `order=oldest&after_id=123` to page forward through older events in ascending ID order. Each event also includes `targetExists`, which lets the admin history link to author/reference pages only while the target still exists. The proposed retention is indefinite unless a concrete storage or legal constraint requires a change. Technical request logs remain separate and retain their existing lifecycle.

API clients may send `X-Task-Id` (also accepts `X-Paperclip-Task-Id` or `X-Codex-Task-Id`) and `X-Request-Id`; `CF-Ray` is used as the request identifier fallback. These values are trimmed and bounded before storage.

## Occurrence API

Occurrences are available at `/api/v1/quotes/{id}/occurrences` (`GET` and `POST`) and `/api/v1/quotes/{id}/occurrences/{oid}` (`PUT` and `DELETE`). Source records require an attribution belonging to the same quote; an optional source occurrence must belong to that quote and attribution. All writes validate referenced quote, attribution, author, and reference IDs before the audited batch.
The SDK client sends `X-Client-Source: sdk`; the CLI overrides it with `cli`. This
source is client-declared metadata and is not an authentication signal. API key
identity and owner are derived from the validated bearer key and remain the
reliable attribution fields. Other clients are recorded as `api_v1` unless they
send one of the recognized source labels.
