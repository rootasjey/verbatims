# Automated Social Posting

Admin-managed social queue and daily scheduled autopost for X, Bluesky, Instagram, Threads, Facebook, and Pinterest.

## Queue management

- **Admin page:** `/admin/social-queue`
- **Queue APIs:** `/api/admin/social-queue/*`
- **Scheduler task:** `tasks/social/autopost.ts`
- **Persistence tables:** `social_queue` and `social_posts`

## Environment variables

### General

| Variable | Default | Description |
|----------|---------|-------------|
| `NUXT_SOCIAL_DAILY_TIMEZONE` | `Europe/Paris` | Timezone for scheduling |
| `NUXT_SOCIAL_DAILY_TIME` | `08:08` | Scheduled posting time |

### X (Twitter)

| Variable | Default | Description |
|----------|---------|-------------|
| `NUXT_X_POST_ENABLED` | `true` | Enable/disable X posting |
| `NUXT_X_POST_ACCESS_TOKEN` | — | OAuth 2.0 User Context access token (preferred) |
| `NUXT_X_POST_OAUTH1_CONSUMER_KEY` | — | OAuth 1.0a consumer key (required for media upload) |
| `NUXT_X_POST_OAUTH1_CONSUMER_SECRET` | — | OAuth 1.0a consumer secret |
| `NUXT_X_POST_OAUTH1_ACCESS_TOKEN` | — | OAuth 1.0a access token |
| `NUXT_X_POST_OAUTH1_ACCESS_TOKEN_SECRET` | — | OAuth 1.0a access token secret |
| `NUXT_X_POST_REQUIRE_MEDIA` | `false` | Fail if image upload fails |

### Bluesky

| Variable | Default | Description |
|----------|---------|-------------|
| `NUXT_BLUESKY_POST_ENABLED` | `false` | Enable/disable Bluesky posting |
| `NUXT_BLUESKY_POST_SERVICE` | `https://bsky.social` | Bluesky PDS service URL |
| `NUXT_BLUESKY_POST_IDENTIFIER` | — | Bluesky handle or identifier |
| `NUXT_BLUESKY_POST_PASSWORD` | — | Bluesky app password |
| `NUXT_BLUESKY_POST_HASHTAGS` | — | Optional space/comma-separated hashtags |

### Instagram

| Variable | Default | Description |
|----------|---------|-------------|
| `NUXT_INSTAGRAM_POST_ENABLED` | `false` | Enable/disable Instagram posting |
| `NUXT_INSTAGRAM_POST_BASE_URL` | `https://graph.facebook.com` | Graph API base URL |
| `NUXT_INSTAGRAM_POST_API_VERSION` | `v24.0` | Graph API version |
| `NUXT_INSTAGRAM_POST_ACCESS_TOKEN` | — | Instagram access token |
| `NUXT_INSTAGRAM_POST_IG_USER_ID` | — | Instagram Business/Creator user ID |
| `NUXT_INSTAGRAM_POST_HASHTAGS` | `#quotes #inspiration #verbatims` | Post hashtags |
| `NUXT_INSTAGRAM_POST_POLL_INTERVAL_MS` | `5000` | Media container poll interval |
| `NUXT_INSTAGRAM_POST_POLL_TIMEOUT_MS` | `300000` | Media container poll timeout |

### Threads

| Variable | Default | Description |
|----------|---------|-------------|
| `NUXT_THREADS_POST_ENABLED` | `false` | Enable/disable Threads posting |
| `NUXT_THREADS_POST_BASE_URL` | `https://graph.threads.net` | Graph API base URL |
| `NUXT_THREADS_POST_API_VERSION` | `v1.0` | API version |
| `NUXT_THREADS_POST_ACCESS_TOKEN` | — | Threads access token |
| `NUXT_THREADS_POST_USER_ID` | — | Threads user ID |
| `NUXT_THREADS_POST_POLL_INTERVAL_MS` | `4000` | Media container poll interval |
| `NUXT_THREADS_POST_POLL_TIMEOUT_MS` | `120000` | Media container poll timeout |

### Facebook

| Variable | Default | Description |
|----------|---------|-------------|
| `NUXT_FACEBOOK_POST_ENABLED` | `false` | Enable/disable Facebook posting |
| `NUXT_FACEBOOK_POST_BASE_URL` | `https://graph.facebook.com` | Graph API base URL |
| `NUXT_FACEBOOK_POST_API_VERSION` | `v24.0` | API version |
| `NUXT_FACEBOOK_POST_ACCESS_TOKEN` | — | Facebook page access token |
| `NUXT_FACEBOOK_POST_PAGE_ID` | — | Facebook Page ID |

### Pinterest

| Variable | Default | Description |
|----------|---------|-------------|
| `NUXT_PINTEREST_POST_ENABLED` | `false` | Enable/disable Pinterest posting |
| `NUXT_PINTEREST_POST_BASE_URL` | `https://api.pinterest.com` | API base URL |
| `NUXT_PINTEREST_POST_API_VERSION` | `v5` | API version |
| `NUXT_PINTEREST_POST_ACCESS_TOKEN` | — | Pinterest access token |
| `NUXT_PINTEREST_POST_BOARD_ID` | — | Default Pinterest board ID |

## Meta reconnect flow (Instagram + Threads + Facebook)

- Provider status is indicated by a coloured dot (green/red) on platform icons in `/admin/social-queue`.
- Tooltips show service name, configuration status, account/ID, expiry, and actions.
- **Check provider** runs the `/provider-check` endpoint.
- **Meta settings** and **Reconnect** buttons are available for Instagram/Threads/Facebook.
- Meta settings configures App ID/Secret/Redirect URI in KV.
- Reconnect requires `META_APP_ID` and `META_APP_SECRET` env vars.
- Credentials are stored in KV (`social:meta:credentials:v1`); social posting resolves KV first, then falls back to env vars.
- If the callback URL is not listed in Facebook Login "Valid OAuth Redirect URIs", reconnect will fail.

## Posting behavior

- One queued item is processed per platform per scheduler run.
- Queue items are platform-scoped (`x`, `bluesky`, `instagram`, `threads`, `facebook`, `pinterest`).
- Posts use a square social image from `/api/social/images/quotes/{id}.png`.
- Bluesky posts include the image and the quote URL as a rich-text link facet.
- X image upload requires OAuth 1.0a credentials; with OAuth 2.0-only, text-only fallback unless `NUXT_X_POST_REQUIRE_MEDIA=true`.
- Instagram creates a media container, polls until ready, and publishes to feed.
- Threads creates a container, polls, and publishes with image + text.
- Facebook publishes a page photo post.
- Pinterest creates an image pin.

## Facebook token helper script

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

## Scheduling model

- Cloudflare cron triggers run at `06:08` and `07:08` UTC.
- The Nitro task checks local time in `NUXT_SOCIAL_DAILY_TIMEZONE` and only publishes when it matches `NUXT_SOCIAL_DAILY_TIME`.
- Each cron run processes up to one eligible queued item per active provider.
- Providers are processed sequentially. `NUXT_SOCIAL_AUTOPOST_MAX_DURATION_MS` caps the total wall-clock budget.
- On deploy, Cloudflare applies cron triggers from `wrangler.jsonc` automatically.
