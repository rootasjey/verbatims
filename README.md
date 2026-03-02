# verbatims

Quote service for discovering, curating, and sharing timeless words, with moderation and admin workflows.

![verbatims screenshot](./public/images/life-is-a-snake.png)

## Overview

verbatims brings quotes, sources, and context together in one place. Browse by topic or author, build personal collections, and quickly share cleanly attributed quotes. The project focuses on accuracy, thoughtful curation, and a pleasant reading experience.

Key ideas:
- Delightful discovery with fast search and smart ranking
- Accurate attribution with references to primary sources where possible
- Community submissions with moderation for quality and clarity
- Clean sharing: copy attribution-ready text or export visuals

## Features

- Browse and search by topic, author, keyword, or reference
- Save favorites and build collections
- Contribute quotes with sources (moderation workflow)
- Report issues (typos, attribution, duplicates)
- Share formatted quote cards or copy clean text with attribution
- Accessible UI: keyboard navigation, high contrast, screen-reader labels

## Tech stack

- Nuxt 4 (Vue 3) for the application framework and SSR
- Pinia for state management
- UnaUI + UnoCSS for UI primitives and utility-first styling
- Nuxt Image for image handling and optimization
- Cloudflare D1/SQLite for database and deployment on Cloudflare Workers
- Drizzle ORM for type-safe database queries
- Auth via `nuxt-auth-utils` (role-based: user, moderator, admin)

See exact versions in `package.json` and configuration in `nuxt.config.ts`.

## Architecture

- Frontend: Nuxt 4 with SSR/SPA hybrid
- Database: Cloudflare D1 (SQLite) via Drizzle ORM
- API: File-based routes under `server/api/*`
- Auth: `getUserSession(event)` on server, `useUserSession()` on client
- State: Pinia stores for global state and preferences
- Deployment: Cloudflare Workers

Helpful references:
- Schema: `server/db/migrations/schema.sql`
- Types: `types/` (e.g., `Quote`, `QuoteWithRelations`)
- Layouts: `layouts/` (`admin.vue`, `dashboard.vue`, `default.vue`)
- Admin pages: `pages/admin/*`
- Composables: `composables/` (e.g., `useDataExport.ts`)

## Getting started

Prerequisites: Node 18+ and your preferred package manager. The project uses Bun by default, but npm/pnpm/yarn work too.
NOTE: You can use any package manager, just replace `bun` with `npm`/`pnpm`/`yarn` in the commands below.

```bash
bun install        # Install dependencies
bun run dev        # Start the dev server at http://localhost:3000
bun run build      # Build for production
bun run preview    # Preview the production build locally
```

Cloudflare wrangler with sqlite will provision a local D1 database automatically. 
The SQL schema lives in `server/db/migrations/schema.sql` and is applied through the Cloudflare integration.

## Scripts

The most common scripts are:
NOTE: You can use any package manager, just replace `bun` with `npm`/`pnpm`/`yarn` in the commands below.

- `bun run dev` - start development server
- `bun run build` - production build
- `bun run preview` - preview the production build

Note: The legacy local CLI utilities under `scripts/` have been removed. Admin operations are now performed through the in-app Admin pages and server APIs (e.g., export, import, backup).

## Data, privacy, and contributions

- Submissions are verified for wording and authorship before publishing; misattributions may be corrected or declined.
- Community reports with citations are encouraged.
- We store only what's needed to run the app (account info, favorites, collections, preferences). We don't sell personal data.
- See in-app pages for details: `/privacy` and `/terms`.

## Deployment

This app targets Cloudflare Workers. 
Follow Nuxt's deployment docs and the Cloudflare Workers guide. 
CI typically runs `nuxt build` and deploys the output using Cloudflare tooling.

## Contributing

Issues and PRs are welcome. Please follow the established code style (TypeScript, strict types, UnoCSS utilities, UnaUI components) and keep UI accessible.

## License

This project is licensed under the MIT License - see `LICENSE`.

## Open Graph (OG) Image Generation

This project provides dynamic, high-quality OG images for quotes, optimized for social sharing and SEO. The system is fully automated and cache-aware, with admin controls for cache management.

### How it works

- **Endpoint:** `GET /api/og/quotes/{id}.png` generates a PNG image for a quote, suitable for Twitter, Facebook, etc.
- **Rendering:** Uses Cloudflare Workers' browser automation (Puppeteer) to screenshot a styled HTML template (`/api/og/templates/quote?id=...`) (e.g. `http://localhost:3001/api/og/templates/quote?id=2309`).
- **Caching:** Images are stored in KV (Cloudflare D1) with a hash based on quote content, author, reference, and style version. This ensures images are regenerated only when content or style changes.
- **Fallback:** If no quote-specific image is available, the default site image (`/images/verbatims.jpeg`) is used.
- **SVG Overlay:** Alternative SVG endpoint (`/api/og/quotes/{id}/overlay`) provides a scalable text overlay for advanced use cases.

### Admin controls

- **Pre-generate OG images:** `POST /api/admin/og/quotes/{id}/generate` (admin/moderator only) triggers generation and caching for a quote.
- **Cache invalidation:** Bump the `NUXT_PUBLIC_OG_STYLE_VERSION` environment variable to force regeneration of all OG images (e.g., after style changes).

### Configuration

- Enable browser rendering in `nuxt.config.ts` with `hub.browser: true`.
- Set `public.siteUrl` and `public.ogStyleVersion` in runtime config for correct URL generation and cache versioning.
- Puppeteer dependencies are managed in `package.json` and installable via VS Code tasks.

### Developer notes

- All OG endpoints and logic are in `server/api/og/` and `server/utils/og.ts`.
- The SEO composable (`composables/useSeo.ts`) automatically sets OG meta tags and image URLs for quote pages.
- Admins can warm the cache or force regeneration as needed.

For more details, see the code in `server/api/og/`, `server/utils/og.ts`, and the configuration in `nuxt.config.ts`.

## Automated Social Posting (X + Bluesky + Instagram + Threads + Facebook + Pinterest)

This project includes an admin-managed social queue and a daily scheduled autopost task for social providers.

### What is included

- Admin queue page: `/admin/social-queue`
- Queue APIs: `/api/admin/social-queue/*`
- Daily scheduler task: `tasks/social/autopost.ts`
- Persistence tables: `social_queue` and `social_posts`

### Environment variables

- `NUXT_X_POST_ENABLED` (default: `true`)
- `NUXT_X_POST_ACCESS_TOKEN` (OAuth 2.0 User Context access token, preferred)
- `NUXT_X_POST_BEARER_TOKEN` (legacy alias for `NUXT_X_POST_ACCESS_TOKEN`, deprecated)
- `NUXT_X_POST_OAUTH1_CONSUMER_KEY` (OAuth 1.0a user context, required for X media upload)
- `NUXT_X_POST_OAUTH1_CONSUMER_SECRET` (OAuth 1.0a user context)
- `NUXT_X_POST_OAUTH1_ACCESS_TOKEN` (OAuth 1.0a user context)
- `NUXT_X_POST_OAUTH1_ACCESS_TOKEN_SECRET` (OAuth 1.0a user context)
- `NUXT_X_POST_REQUIRE_MEDIA` (default: `false`, when `true` autopost fails if image upload to X fails)
- `NUXT_BLUESKY_POST_ENABLED` (default: `false`)
- `NUXT_BLUESKY_POST_SERVICE` (default: `https://bsky.social`)
- `NUXT_BLUESKY_POST_IDENTIFIER` (Bluesky handle or identifier)
- `NUXT_BLUESKY_POST_PASSWORD` (Bluesky app password)
- `NUXT_INSTAGRAM_POST_ENABLED` (default: `false`)
- `NUXT_INSTAGRAM_POST_BASE_URL` (default: `https://graph.facebook.com`)
- `NUXT_INSTAGRAM_POST_API_VERSION` (default: `v24.0`)
- `NUXT_INSTAGRAM_POST_ACCESS_TOKEN` (required for Instagram publishing)
- `NUXT_INSTAGRAM_POST_IG_USER_ID` (required Instagram Business/Creator user id)
- `NUXT_INSTAGRAM_POST_HASHTAGS` (default: `#quotes #inspiration #verbatims`)
- `NUXT_INSTAGRAM_POST_POLL_INTERVAL_MS` (default: `5000`)
- `NUXT_INSTAGRAM_POST_POLL_TIMEOUT_MS` (default: `300000`)
- `NUXT_THREADS_POST_ENABLED` (default: `false`)
- `NUXT_THREADS_POST_BASE_URL` (default: `https://graph.threads.net`)
- `NUXT_THREADS_POST_API_VERSION` (default: `v1.0`)
- `NUXT_THREADS_POST_ACCESS_TOKEN` (required for Threads publishing)
- `NUXT_THREADS_POST_USER_ID` (required Threads user id)
- `NUXT_THREADS_POST_POLL_INTERVAL_MS` (default: `4000`)
- `NUXT_THREADS_POST_POLL_TIMEOUT_MS` (default: `120000`)
- `NUXT_FACEBOOK_POST_ENABLED` (default: `false`)
- `NUXT_FACEBOOK_POST_BASE_URL` (default: `https://graph.facebook.com`)
- `NUXT_FACEBOOK_POST_API_VERSION` (default: `v24.0`)
- `NUXT_FACEBOOK_POST_ACCESS_TOKEN` (required for Facebook publishing)
- `NUXT_FACEBOOK_POST_PAGE_ID` (required Facebook Page id)
- `NUXT_PINTEREST_POST_ENABLED` (default: `false`)
- `NUXT_PINTEREST_POST_BASE_URL` (default: `https://api.pinterest.com`)
- `NUXT_PINTEREST_POST_API_VERSION` (default: `v5`)
- `NUXT_PINTEREST_POST_ACCESS_TOKEN` (required for Pinterest publishing)
- `NUXT_PINTEREST_POST_BOARD_ID` (required default Pinterest board id for automatic posting)
- `NUXT_SOCIAL_DAILY_TIMEZONE` (default: `Europe/Paris`)
- `NUXT_SOCIAL_DAILY_TIME` (default: `08:08`)

### Meta reconnect flow (Instagram + Threads + Facebook)

- Provider status for every social service is now indicated by a small coloured dot (green/red) on the platform icons and is also displayed via tooltips on the platform icons in `/admin/social-queue` (hover the icon).
- Tooltips show the service name, whether it’s configured, account/ID, expiry, and actions:
  - **Check provider** runs the existing `/provider-check` endpoint.
  - **Meta settings** and **Reconnect** buttons are available when hovering Instagram/Threads/Facebook.
- `Meta settings` still configures App ID/Secret/Redirect URI in KV.
- Reconnect requires server env vars `META_APP_ID` and `META_APP_SECRET` (optional `META_REDIRECT_URI`).
- The reconnect flow stores credentials in KV (`social:meta:credentials:v1`) and social posting resolves KV first, then falls back to env vars.
- Covered providers in this flow:
	- Instagram (user token + IG user id)
	- Threads (user token + Threads user id, when available from the granted permissions)
	- Facebook (page token + page id)
- If the tooltip’s provider-check reports missing credentials, reconnect Meta first before editing env vars.
- If reconnect fails in local/dev, first verify the callback URL is listed in Facebook Login "Valid OAuth Redirect URIs" and your app mode/roles allow the account used for login.

### Posting behavior

- One queued item is processed per scheduler run.
- Queue items are platform-scoped (`x`, `bluesky`, `instagram`, `threads`, `facebook`, or `pinterest`) for insertion.
- Autopost now uses a square social image generated from `/api/social/images/quotes/{id}.png`.
- Bluesky posts include the square social image.
- X posts use user-context auth only (OAuth 2.0 User Context or OAuth 1.0a).
- X image upload requires OAuth 1.0a credentials; with OAuth 2.0-only credentials, posting falls back to text-only unless `NUXT_X_POST_REQUIRE_MEDIA=true`.
- Instagram posts create a Graph API media container, poll until ready, and publish to feed with image + caption.
- Threads posts create a Graph Threads container, poll until ready, and publish with image + text.
- Facebook posts publish a page photo post (image + message).
- Pinterest posts create an image pin in `NUXT_PINTEREST_POST_BOARD_ID` using the quote image + link.

### Facebook token helper script

Use the helper script to automate the CLI steps for Facebook (app token, long-lived user token exchange, page token retrieval, token debug, page verification):

```bash
# run the full flow (does not write files)
bun run facebook:token -- from-user-token \
	--app-id "$META_APP_ID" \
	--app-secret "$META_APP_SECRET" \
	--user-token "$SHORT_USER_TOKEN" \
	--page-id "$NUXT_FACEBOOK_POST_PAGE_ID"

# run full flow and write/update .env automatically
bun run facebook:token:write -- \
	--app-id "$META_APP_ID" \
	--app-secret "$META_APP_SECRET" \
	--user-token "$SHORT_USER_TOKEN" \
	--page-id "$NUXT_FACEBOOK_POST_PAGE_ID"

# verify an existing page token
bun run facebook:token -- verify-page-token \
	--app-id "$META_APP_ID" \
	--app-secret "$META_APP_SECRET" \
	--page-id "$NUXT_FACEBOOK_POST_PAGE_ID" \
	--page-token "$NUXT_FACEBOOK_POST_ACCESS_TOKEN"
```

### Scheduling model

- Cloudflare cron triggers run at `06:08` and `07:08` UTC.
- The Nitro task checks local time in `NUXT_SOCIAL_DAILY_TIMEZONE` and only publishes when it matches `NUXT_SOCIAL_DAILY_TIME`.
- This keeps scheduling aligned with local time behavior while handling Paris DST on UTC infrastructure.
- On deploy, Cloudflare applies cron triggers from `wrangler.jsonc` automatically for the target environment.
- If you change cron expressions, redeploy to apply the updated schedule.
