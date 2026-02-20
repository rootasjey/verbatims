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
