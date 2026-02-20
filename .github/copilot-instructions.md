# Verbatims - AI Coding Agent Instructions

## Project Overview

Verbatims is a **Nuxt 4 quote management application** with user-generated content, moderation workflows, and admin capabilities. 
Built on **Cloudflare Workers**, **UnaUI** (UnoCSS), **Pinia**.

## Architecture & Stack
- **Frontend**: Nuxt 4 + Vue 3 with SSR/SPA hybrid
- **Database**: Cloudflare D1 (SQLite) via Drizzle ORM
- **Backend**: Nuxt server APIs with file-based routing
- **UI**: UnaUI components + UnoCSS utility-first CSS
- **Auth**: nuxt-auth-utils with role-based access (user/moderator/admin)
- **State**: Pinia stores for global state management
- **Deployment**: Cloudflare Workers

## Core Data Model
```
users (role: user|moderator|admin)
├── quotes (status: draft|pending|approved|rejected)
│   ├── author_id → authors
│   └── reference_id → quote_references (books, films, etc.)
├── collections (user quote collections)
└── tags (quote categorization)
```

Key relationship: `quotes` belong to `users`, optionally link to `authors` and `quote_references`.

## Essential Patterns

### 1. API Route Structure
Server APIs follow Nuxt's file-based routing in `/server/api/`:
```
/api/admin/quotes/pending.get.ts    # Admin endpoints
/api/quotes/[id].get.ts            # Resource endpoints
/api/auth/login.post.ts            # Auth endpoints
```

**Pattern**: Use `getUserSession(event)` for auth, import `db` and `schema` from 'hub:db' for database access:
```typescript
import { db, schema } from 'hub:db'
import { eq, and, desc } from 'drizzle-orm'

const session = await getUserSession(event)
const quotes = await db.select().from(schema.quotes).where(eq(schema.quotes.status, 'approved'))
```

### 2. Database Queries
Use Drizzle ORM query builder with type-safe schema references:
```typescript
import { db, schema } from 'hub:db'
import { eq, and, or, like, desc, count, sql } from 'drizzle-orm'

// Simple query
const quote = await db.select().from(schema.quotes).where(eq(schema.quotes.id, quoteId)).get()

// Query with joins
const quotesWithAuthor = await db.select({
  ...getTableColumns(schema.quotes),
  author_name: schema.authors.name,
  author_is_fictional: schema.authors.isFictional
})
  .from(schema.quotes)
  .leftJoin(schema.authors, eq(schema.quotes.authorId, schema.authors.id))
  .where(eq(schema.quotes.status, 'approved'))

// Insert
await db.insert(schema.quotes).values({ name: 'Quote text', userId: 1, status: 'draft' })

// Update
await db.update(schema.quotes).set({ status: 'approved' }).where(eq(schema.quotes.id, quoteId))

// Delete
await db.delete(schema.quotes).where(eq(schema.quotes.id, quoteId))

// Complex aggregations with sql template
const stats = await db.select({
  total: count(),
  approved: sum(sql`CASE WHEN ${schema.quotes.status} = 'approved' THEN 1 ELSE 0 END`)
}).from(schema.quotes)
```

### 3. Type System
Strict TypeScript with comprehensive type definitions in `/types/`:
- `Quote`, `QuoteWithRelations`, `CreateQuoteData` patterns
- Extends base types with additional fields (e.g., `AdminQuote extends QuoteWithRelations`)
- Use type-safe status enums: `'draft' | 'pending' | 'approved' | 'rejected'`

### 4. Component Architecture
- **Layouts**: `admin.vue`, `dashboard.vue`, `default.vue` for different user contexts
- **Pages**: Follow `/pages` structure with dynamic routes like `[id].vue`
- **Components**: Global auto-imported, use UnaUI primitives (`UButton`, `UCard`, etc.)
- **Utilities**: exported functions from `~/server/utils/` are auto-imported in Nuxt server context

### 5. Admin Interface Patterns
Admin pages use consistent structure:
```vue
<!-- Fixed header with stats and filters -->
<div class="flex-shrink-0 bg-gray-50 dark:bg-[#0C0A09] border-b border-dashed">
  <!-- Search, filters, stats cards -->
</div>
<!-- Scrollable content area -->
<div class="flex-1 flex flex-col min-h-0">
  <UTable :columns="tableColumns" :data="filteredQuotes" />
</div>
```

### 6. Authentication & Authorization
- Middleware: `auth.ts` (logged in), `admin.ts` (admin/moderator only)
- Session: `const { user } = useUserSession()` in components
- Server: `await getUserSession(event)` in API routes

### 7. State Management
- **Language Store**: Global language selection with `useLanguageStore()`
- **Reactive patterns**: Use `ref()` for simple state, `reactive()` for complex objects
- **Composables**: Business logic in `/composables/` (e.g., `useDataExport.ts`)

## Development Workflow

### Running the App
```bash
bun install        # Install dependencies
bun run dev        # Start dev server (localhost:3000)
bun run build      # Production build
```

Note: the dev server (e.g. `npm run dev`, `bun run dev` or `nuxt dev`) is a long-running process and will occupy the current terminal session. If you need to run other commands while the server is running, either:

- Open a second terminal/tab and run the additional commands there (recommended), or
- Background the process and detach it (example in fish/bash):

```fish
# start the dev server in background
npm run dev &
# detach it from the session (optional)
disown

# or use nohup to keep it running after logout
nohup npm run dev >/dev/null 2>&1 &
```

You can also use a terminal multiplexer (tmux/screen) to keep the dev server running in its own pane/window.

### Database Migrations
Schema in `/server/db/migrations/`.

### Key Commands
- `nuxt dev` - Development with hot reload
- `nuxt build` - Production build for Cloudflare Pages
- Database managed through Cloudflare dashboard

### Build policy
- Do not run `bun run build`, `nuxt build`, or other production build commands unless the user explicitly asks for them. Automated builds are only permitted when directly requested.

## Common Patterns

### Error Handling
```typescript
throwServer(403, 'Admin access required')
```

### API Response Format
```typescript
return {
  data: results,
  total: count,
  page: currentPage,
  hasMore: boolean
}
```

### Component Props with TypeScript
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

### Styling Conventions
- Use UnaUI components and UnoCSS over custom CSS
- Dark mode support with `dark:` prefixes
- Consistent spacing with dashed borders: `border-dashed border-gray-200 dark:border-gray-700`
- Color palette: Primary blue (`#687FE5`), semantic colors for status
- In USelect component: Use `value-key="label"` so that the selected value is nicely displayed with its label (e.g. `Pending Review` instead of `pending`)
- In UDropdownMenu component: Use `onclick` event for item actions
- In UButton component: Use `btn` prop for styling variations

### UnaUI / Component style props

When customizing UnaUI/Naive-style components in this project, do not rely on a generic `variant` prop — that prop doesn't exist on these primitives. Instead the component-specific styling prop usually matches the component name. For example:

- `NBadge` → `badge`
- `NButton` → `btn`
- `NInput` → `input`
- `NAvatar` → `avatar`

Use these props to control style variants consistently across components instead of looking for `variant`.

### NSelect typing rule

When using `NSelect`, always keep `v-model` and `:items` on the same type.

- If `:items` is `Option[]` (where `type Option = { label: string; value: string }`), bind `v-model` to `Option` (or `Option | null`) and map to primitive values in computed setters/getters when the parent needs the primitive id.
- Prefer `item-key="label"` and `value-key="label"` so the control displays human-friendly labels while the `v-model` remains an `Option` object from the same `:items` array.
- If `:items` is `string[]`, bind `v-model` to `string`.
- Ensure `typeOptions` (and similar option lists) are typed as `Option[]` — avoid `any[]` or `unknown[]` so TypeScript can protect against mismatches.
- Do not mix `Option[]` items with `string` model values directly; this causes runtime/type issues (e.g. `Type 'Option[]' is not assignable to type '(string | SelectGroup<string>)[]'`).

## Key Files to Reference
- `/nuxt.config.ts` - Core configuration and modules
- `/types/quote.d.ts` - Main data model types
- `/server/database/migrations/schema.sql` - Database schema
- `/layouts/admin.vue` - Admin interface structure
- `/pages/admin/quotes/drafts.vue` - Example admin CRUD interface
- `/stores/language.ts` - Global state patterns
- `/composables/useDataExport.ts` - Complex business logic patterns

When implementing features, follow the established patterns for authentication, database queries, type safety, and UI consistency.
You can challenge and improve these patterns and instructions if you find better approaches.
