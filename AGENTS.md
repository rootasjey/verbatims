You are an experienced, pragmatic software engineering AI agent. Do not over-engineer a solution when a simple one is possible. Keep edits minimal. If you want an exception to ANY rule, you MUST stop and get permission first.

# AGENTS.md

This file is the canonical repository guide for coding agents working in **Verbatims**.
Follow these instructions before relying on tool-specific instruction files.

## Project overview

Verbatims is a **Nuxt 4 quote management application** with user-generated content, moderation workflows, and admin capabilities.
Main stack:

- **Frontend**: Nuxt 4 + Vue 3
- **Backend**: Nuxt server APIs with file-based routing
- **Database**: Cloudflare D1 (SQLite) via Drizzle ORM
- **UI**: UnaUI components + UnoCSS utility classes
- **Auth**: `nuxt-auth-utils` with role-based access (`user`, `moderator`, `admin`)
- **State**: Pinia stores and composables
- **Deployment**: Cloudflare Workers
- **Package Manager**: Bun (default); npm/pnpm/yarn also supported

## Core domain model

Main relationships:

```text
users (role: user|moderator|admin)
├── quotes (status: draft|pending|approved|rejected)
│   ├── author_id → authors
│   └── reference_id → quote_references
├── collections
└── tags
```

Key relationship: `quotes` belong to `users`, and may link to `authors` and `quote_references`.

## Essential commands

- **Development server**: `bun run dev` (or `npm run dev`)
- **Type checking**: `bun run typecheck` or `npm run typecheck`
- **Production build**: `bun run build` (requires explicit user request)
- **Preview build**: `bun run preview`
- **Version bump**: `bun run bump:version` (patch), `bun run bump:fix` (hotfix), `bun run bump:minor`, `bun run bump:major`
- **Tag version**: `git tag -a v$(node -e "console.log(require('./package.json').version)") -m "Release v$(node -e "console.log(require('./package.json').version)")"` (after commit)
- **Database sync**: `bun run db:sync-local` (sync local DB from Wrangler)
- **Token generation**: `bun run facebook:token`, `bun run instagram:token` (and variants with `:write-env`)

## Architecture and code organization

### API routes

Server APIs follow Nuxt file-based routing under `/server/api/`.
Examples:

```text
/api/admin/quotes/pending.get.ts
/api/quotes/[id].get.ts
/api/auth/login.post.ts
```

Patterns to follow:

- Use `await getUserSession(event)` for server-side auth checks.
- Import database access from `hub:db`.
- Prefer type-safe schema access via Drizzle.

Example:

```ts
import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'

const session = await getUserSession(event)
const quotes = await db
  .select()
  .from(schema.quotes)
  .where(eq(schema.quotes.status, 'approved'))
```

### Database queries

Use Drizzle ORM query builder with schema references.
Prefer explicit selects, joins, and typed query construction over loose SQL when possible.

Common operations in this repo include:

- `db.select().from(...)`
- `db.insert(...).values(...)`
- `db.update(...).set(...).where(...)`
- `db.delete(...).where(...)`
- aggregations using `sql`, `count`, and related helpers

### Types

TypeScript is strict and central to this codebase.
Follow existing type patterns in `shared/types/` and nearby modules.

Conventions:

- Extend base entities for richer admin/view types.
- Keep status values typed explicitly, e.g. `'draft' | 'pending' | 'approved' | 'rejected'`.
- Avoid `any` and preserve model consistency between API, composables, and pages.

### Frontend structure

- **Layouts** define major contexts such as `admin.vue`, `dashboard.vue`, `default.vue`.
- **Pages** follow `/pages` conventions, including dynamic routes like `[id].vue`.
- **Components** are generally auto-imported from `app/components/`.
  - **Nested folders:** Components inside subdirectories (e.g. `app/components/home/`) are auto-imported with the folder name as prefix: `<HomeSpotlightQuote />`.
  - **Alternative:** Explicitly import nested components in the page to use unprefixed names: `import SpotlightQuote from '~/components/home/SpotlightQuote.vue'` then use `<SpotlightQuote />`.
- **Composable logic** belongs in `app/composables/`.
- **Server utilities** under `~/server/utils/` are commonly reused across API handlers.

### ⚠️ SSR awareness (common gotcha)

Nuxt runs composables, components, and pages on **both server (SSR) and client** during the initial render.

- `localStorage`, `sessionStorage`, `window`, `document`, and other browser-only APIs are **not available on the server**.
- Any code relying on these must be deferred to `onMounted()`, placed in a `watch()` that only fires client-side, or guarded with `import.meta.client`.
- **Hydration mismatches** happen when server-rendered HTML differs from the first client render. This shows as class/attribute mismatches in console warnings and can cause visual glitches (wrong button selected, stale data).
- **Safe pattern for persisted state**: keep the composable SSR-safe (default value), then read/write browser APIs in the **page's** `onMounted` / `watch`. This ensures SSR and first client render match exactly.
- **Layout switching masks SSR issues**: Components rendered only in layouts that are switched to client-side via `setPageLayout()` (e.g. `mobile.vue`) never run during SSR. If you remove layout switching and put them in a default SSR layout, wrap them in `<ClientOnly>` or ensure they're SSR-safe.
- **reka-ui / vaul-vue modals crash SSR**: `NDialog`, `NDrawer`, and similar components built on `reka-ui` (through `vaul-vue`) throw `Cannot read properties of null (reading 'ce')` during server render because `DialogRoot.renderSlot` receives null slots. Always wrap these in `<ClientOnly>` — they start closed, so no content is lost.
- **`useFetch` with a computed `query` can lose SSR data**: Nuxt's payload key is a hash of the URL + options. If you pass a `computed` ref to the `query` option, the client-side key may differ from the SSR key (depending on how the ref is serialized). The SSR-payload data is silently discarded, and `useFetch` resolves asynchronously after setup. Code that reads `data.value?.xxx` immediately after `await useFetch()` sees `null` and never retries. **Fix**: watch the data ref reactively, or use a simple ref/object for `query` and call `refresh()` when the query value changes.

```ts
// ❌ Bad - composable runs on server, localStorage is undefined
const saved = localStorage.getItem('key')  // crashes or returns wrong value

// ✅ Good - page runs onMounted client-only, composable stays SSR-safe
onMounted(() => {
  const saved = localStorage.getItem('key')
  if (saved) selectedPlatform.value = saved
})

```ts
// ❌ Bad - useFetch with computed query, data read once after await
const { data, refresh } = await useFetch('/api/items', { query: myComputed })
if (data.value?.items) items.value = data.value.items  // null on hydration

// ✅ Good - watch the data ref reactively
const { data } = await useFetch('/api/items', { query: myComputed })
watch(data, (d) => { if (d?.items) items.value = d.items }, { immediate: true })
```

## Admin UI conventions

Admin pages usually follow this shape:

- a fixed or top section for filters, search, stats, and actions
- a scrollable content area below
- table-driven management UIs

When editing admin pages:

- keep visual structure consistent with existing admin screens
- preserve dark mode behavior
- prefer existing component patterns over introducing bespoke UI

## Authentication and authorization

- Middleware examples: `auth.ts`, `admin.ts`
- In components, prefer `const { user } = useUserSession()`
- In server routes, use `await getUserSession(event)`
- Respect role boundaries for admin/moderator functionality

## State management

- Use Pinia for shared app state where appropriate
- Use `ref()` for simple state and `reactive()` for grouped state
- Put reusable business logic into composables

## Common coding patterns

### Error handling

Use the project error helpers and established server patterns.
Example:

```ts
throwServer(403, 'Admin access required')
```

### API response shape

Prefer consistent structured responses such as:

```ts
return {
  data: results,
  total: count,
  page: currentPage,
  hasMore: boolean
}
```

### Typed Vue props

Use typed props with sensible defaults:

```vue
<script setup lang="ts">
interface Props {
  quote: QuoteWithRelations
  featured?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  featured: false
})
</script>
```

## Styling conventions

- Prefer **UnaUI** components and **UnoCSS** utility classes over custom CSS
- Preserve dark mode support using `dark:` utilities
- Reuse existing spacing, border, and status-color conventions already present in admin pages
- In select components, prefer human-friendly display values
- In dropdown menu items, use `onclick` for actions when following existing menu patterns

### UnaUI component style props

Do **not** assume a generic `variant` prop exists.
Use the component-specific style prop instead, for example:

- `NBadge` → `badge`
- `NButton` → `btn`
- `NInput` → `input`
- `NAvatar` → `avatar`

### NSelect typing rule

When using `NSelect`, keep `v-model` and `:items` on compatible types.

- If `:items` is `Option[]`, bind `v-model` to `Option` (or `Option | null`)
- If `:items` is `string[]`, bind `v-model` to `string`
- Prefer typed option arrays over `any[]` / `unknown[]`
- Do not mix object options with primitive model values directly

## Development workflow guidance

### Commands

Common commands include:

- `bun run dev` / `nuxt dev`
- `bun run typecheck`
- version bump scripts (e.g., `bun run bump:version`)

### Long-running processes

Dev servers are long-running processes. Do not block your workflow on them unnecessarily.

### Dev server lifecycle

- **Check before starting**: Before running `bun run dev` (or `npm run dev`), check if a dev server is already running on `http://localhost:3002` (e.g. via `curl -o /dev/null -s -w "%{http_code}" http://localhost:3002`). If it's already up, reuse it — do not start a second instance.
- **Don't kill for cleanup**: Never kill the dev server to "clean up" processes. Only stop it when:
  - The user explicitly asks you to, or
  - Restarting is necessary for changes to take effect (e.g. server-side code changes that aren't hot-reloaded).
- **Restart when needed**: If the dev server needs a restart to pick up changes, first verify it's actually running, then stop it with `npx kill-port 3002` (targets only the process listening on that port) and restart deliberately.
- **No manual restart for config**: Nuxt auto-reboots when `.env` or `nuxt.config.ts` changes — no need to kill and restart manually.

### Build policy

Do **not** run production build commands such as `npm run build`, `bun run build`, or `nuxt build` unless the user explicitly asks for them.

## Database migrations

Schema changes are tracked in `server/db/migrations/sqlite/` as numbered SQL files (e.g. `0009_add_reference_id_filter.sql`). The consolidated `server/db/migrations/schema.sql` and Drizzle `server/db/schema.ts` are also updated for fresh deploys.

**Production**: migration files are applied against Cloudflare D1 via wrangler:

```bash
wrangler d1 execute verbatims-db --file server/db/migrations/sqlite/0009_add_reference_id_filter.sql
```

To preview locally first:

```bash
wrangler d1 execute verbatims-db --file server/db/migrations/sqlite/0009_add_reference_id_filter.sql --local
```

Always create a new numbered migration file when altering existing tables (adding columns, changing constraints, etc.). New tables that don't exist yet can rely on `schema.sql` being applied on fresh deploys.

## Key files to inspect first

- `/nuxt.config.ts`
- `/shared/types/quote.d.ts`
- `/layouts/admin.vue`
- `/pages/admin/quotes/drafts.vue`
- `/app/stores/language.ts`
- `/app/composables/useDataExport.ts`

## Commit and Pull Request Guidelines

### Commit messages

Use the project's emoji-prefixed convention:

```
<emoji> <type>(<scope>)?: <description>
```

Common types: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `style`.

Examples:
- `✨ feat(admin): add bulk approve action`
- `🚑 fix: resolve quote deletion error`
- `📝 docs: update AGENTS.md with commands`
- `🔗 refactor(auth): simplify session checks`

### Versioning

The version **must** be bumped on every commit that changes functionality.
This is part of the commit workflow — do not skip it.

Bump type reference (evaluate the change before choosing):

- `patch` / `fix` — small fixes, UI tweaks, non-breaking corrections
- `minor` — new non-breaking features
- `major` — breaking changes

Workflow (in order):

1. Make your changes
2. Choose the appropriate bump script and run it:
   ```bash
   bun run bump:version   # patch — bugfixes, small tweaks
   bun run bump:minor    # minor — new features, non-breaking
   bun run bump:major    # major — breaking changes
   ```
3. Stage all files, including the updated `package.json`
4. Commit with a proper message
5. Tag the release:
   ```bash
   git tag -a v$(node -e "console.log(require('./package.json').version)") -m "Release v$(node -e "console.log(require('./package.json').version)")"
   ```

Note: `bun run bump:version` bumps patch, `bun run bump:fix` bumps fix (same as patch), `bun run bump:minor` bumps minor.

### Pull requests

- Provide a clear description of the change and its rationale.
- Reference related issues or tasks.
- Include screenshots or recordings for UI changes.
- Ensure `typecheck` passes locally before requesting review.
- Keep PRs focused and reasonably sized.


## Toast notification rules

When using `useToast().toast({...})`:

- **Valid `toast` values**: use prefixed variants for visible backgrounds: `soft-success`, `solid-error`, `outline-warning`, `outline-success`, `outline-error`, `outline-gray`, etc. Bare values like `'success'`, `'error'`, `'warning'` make the background transparent.
- **Don't toast immediately visible changes**: if the user can see the result right away (item removed from list, status toggled, dialog closed), skip the toast.
- **Don't toast after dialog close**: closing a dialog is feedback enough. Only toast if the action is not observable in the current UI (background process, settings saved for another context).
- **Do toast errors**: always show a toast on failure, using `soft-error` or `outline-error`.

## Working principles for agents

- Follow established patterns for authentication, data access, typing, and UI consistency
- Make minimal, targeted, reviewable changes
- Prefer existing abstractions before introducing new ones
- Validate the specific area you changed with the most relevant check available
- If you find a better approach than the documented pattern, improve it carefully rather than copying a weak pattern blindly

## Design Context

### Users
General audience: quote lovers, casual browsers, content sharers, and curators. The app serves anyone who enjoys discovering, saving, and sharing attributed quotes from films, books, games, speeches, and more. Users interact both on desktop (full-featured browsing) and mobile (quick check-ins, diary, sharing).

### Brand Personality
- **3 words**: Refined, premium, timeless
- **Tone**: Elegant, restrained, classic — like a well-designed publication or a personal library
- **Emotion**: Trustworthy, curated, intentional. The interface should feel like a thoughtfully edited collection, not a firehose of content.
- **Voice**: Confident but warm. The writing should be clear and human, not corporate or hype-driven.

### Aesthetic Direction
- **Current direction**: Homepage was recently revamped in a newspaper/editorial style (desktop + mobile). The diary page (mobile) is now being aligned with that direction.
- **References**: Think editorial design — typography-forward, generous whitespace, intentional hierarchy, muted tones with measured accent color.
- **Anti-references**: Generic AI-era design (gradient text, glassmorphism, purple/blue glow, Inter/Roboto fonts, hero metric cards, overused card grids).
- **Theme**: Both light and dark modes supported. Background: `#FAFAF9` (light) / `#0C0A09` (dark).
- **Font stack**: Nunito (body), General Sans (sans), Gambetta (serif), Pilcrow Rounded (subtitle), Khand (title) — all served via Fontshare.

### Design Principles
1. **Typography leads**: Hierarchy should be unmistakable. Size, weight, and spacing — not color or decoration — should communicate importance. The serif (Gambetta) signals editorials/headlines; sans (General Sans) signals body/interfaces.
2. **Whitespace is structural**: Use generous negative space to create breathing room and signal section boundaries. Crowded = cheap. Spacious = premium.
3. **Color with restraint**: Primary blue (`#3C82F6`) and secondary orange (`#FAA533`) should be used sparingly and purposefully. The palette should feel quiet, letting content take center stage.
4. **Motion that serves**: Animations should feel like paper moving — subtle, purposeful, never gratuitous. Staggered reveals and gentle fades support the reading rhythm.
5. **Do not look AI-generated**: Avoid every anti-pattern in the frontend-design skill. The interface should feel human-crafted, intentional, and specific to the content it serves.
6. **Editorial over dashboard**: Favor reading layouts over data-dashboard layouts. Stats and metrics should be tucked into the design, not leading with them.
