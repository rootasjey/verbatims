# Open Graph (OG) Image Generation

Dynamic, high-quality OG images for quotes, optimized for social sharing and SEO. Fully automated and cache-aware, with admin controls for cache management.

## How it works

- **Endpoint:** `GET /api/og/quotes/{id}.png` generates a PNG image for a quote.
- **Rendering:** Uses Cloudflare Workers' browser automation (Puppeteer) to screenshot a styled HTML template (`/api/og/templates/quote?id=...`).
- **Caching:** Images are stored in KV with a hash based on quote content, author, reference, and style version. Images are regenerated only when content or style changes.
- **Fallback:** Default site image (`/images/verbatims.jpeg`) used when no quote-specific image is available.
- **SVG Overlay:** Alternative SVG endpoint (`/api/og/quotes/{id}/overlay`) provides a scalable text overlay for advanced use cases.

## Admin controls

- **Pre-generate OG images:** `POST /api/admin/og/quotes/{id}/generate` (admin/moderator only) triggers generation and caching.
- **Cache invalidation:** Bump `NUXT_PUBLIC_OG_STYLE_VERSION` environment variable to force regeneration of all OG images.
- **Cache clear:** `DELETE /api/admin/og/quotes/{id}/clear-cache` removes a cached OG image.

## Configuration

- Enable browser rendering in `nuxt.config.ts` with `hub.browser: true`.
- Set `public.siteUrl` and `public.ogStyleVersion` in runtime config.
- Puppeteer dependencies are managed in `package.json`.

## Developer notes

- All OG endpoints and logic live in `server/api/og/` and `server/utils/og.ts`.
- The SEO composable (`composables/useSeo.ts`) automatically sets OG meta tags and image URLs for quote pages.
