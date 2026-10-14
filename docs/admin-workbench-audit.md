# Admin workbench: audit and decisions

This pass follows the product decision to keep admin operations intact while putting quote moderation and editorial theme curation first. No existing admin route or destructive capability is removed here.

## Admin overview

The overview now gives the moderation queue first priority, keeps theme/author/reference curation close by, and moves recent activity below those tasks. Low-action totals and links already present in the sidebar were removed from this landing view; their underlying data and routes remain available.

## Data export

Keep `/admin/export`. It creates selective, domain-aware Verbatims exports and maintains an export history for transfer/reuse. Cloudflare's D1 export serves a different purpose: Wrangler produces SQL for database backup, local development, or migration. It is not a replacement for a curated app-level export. The UI now states this distinction.

- [Cloudflare Wrangler D1 commands](https://developers.cloudflare.com/d1/wrangler-commands/)
- [Cloudflare D1 import/export best practices](https://developers.cloudflare.com/d1/best-practices/import-export-data/)

## Theme creation and automation

New themes now open on the manual editor. The AI-generated suggestion step, AI name button, and AI settings are no longer part of the admin creation journey. Deterministic filter recommendations and the existing theme editing, scheduling, activation, and default controls remain.

The older AI endpoints and stored provider settings are retained for now: this pass does not establish whether another client or an existing workflow uses them. Remove those server-side capabilities only after checking usage and deciding a deprecation/migration path.

For reproducible curation, `/api/v1/themes/apply` accepts a versioned JSON manifest. The SDK exposes `themes.apply`; the CLI adds `themes apply <file> --dry-run`. The manifest reconciles the required name and filters while retaining IDs for unchanged filters. Supplied translations reconcile by language and include homepage copy; omitted per-translation copy and omitted optional metadata are preserved. Activation and default status are always preserved. The companion SDK repository includes a sample manifest and documents the CLI workflow.

## Operations retained

Import/export, database maintenance, API keys, users, messages, social queue, enrichment, harvesting, and all quote-management routes remain reachable in the admin navigation. This pass focuses the overview and shell rather than taking away less-frequently-used tools.
