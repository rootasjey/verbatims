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


## Working principles for agents

- Follow established patterns for authentication, data access, typing, and UI consistency
- Make minimal, targeted, reviewable changes
- Prefer existing abstractions before introducing new ones
- Validate the specific area you changed with the most relevant check available
- If you find a better approach than the documented pattern, improve it carefully rather than copying a weak pattern blindly
