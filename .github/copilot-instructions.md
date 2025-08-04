# Verbatims - AI Coding Agent Instructions

## Project Overview
Verbatims is a **Nuxt 3 quote management application** with user-generated content, moderation workflows, and admin capabilities. Built with **NuxtHub** (Cloudflare D1), **UnaUI**, **Pinia**, and **UnoCSS**.

## Architecture & Stack
- **Frontend**: Nuxt 3 + Vue 3 with SSR/SPA hybrid
- **Database**: Cloudflare D1 (SQLite) via NuxtHub
- **UI**: UnaUI components + UnoCSS utility-first CSS
- **Auth**: nuxt-auth-utils with role-based access (user/moderator/admin)
- **State**: Pinia stores for global state management
- **Deployment**: Cloudflare Pages via NuxtHub

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

**Pattern**: Use `getUserSession(event)` for auth, `hubDatabase()` for DB access:
```typescript
const session = await getUserSession(event)
const db = hubDatabase()
```

### 2. Database Queries
Use D1's prepared statements with proper joins for related data:
```typescript
const quotesResult = await db.prepare(`
  SELECT q.*, a.name as author_name, r.name as reference_name, u.name as user_name
  FROM quotes q
  LEFT JOIN authors a ON q.author_id = a.id
  LEFT JOIN quote_references r ON q.reference_id = r.id
  LEFT JOIN users u ON q.user_id = u.id
  WHERE q.status = ?
`).bind(status).all()
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

### Database Migrations
Schema in `/server/database/migrations/schema.sql` - NuxtHub handles D1 provisioning automatically.

### Key Commands
- `nuxt dev` - Development with hot reload
- `nuxt build` - Production build for Cloudflare Pages
- Database managed through NuxtHub dashboard

## Common Patterns

### Error Handling
```typescript
throw createError({
  statusCode: 403,
  statusMessage: 'Admin access required'
})
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
- Use UnaUI components over custom CSS
- Dark mode support with `dark:` prefixes
- Consistent spacing with dashed borders: `border-dashed border-gray-200 dark:border-gray-700`
- Color palette: Primary blue (`#687FE5`), semantic colors for status

## Key Files to Reference
- `/nuxt.config.ts` - Core configuration and modules
- `/types/quote.d.ts` - Main data model types
- `/server/database/migrations/schema.sql` - Database schema
- `/layouts/admin.vue` - Admin interface structure
- `/pages/admin/quotes/drafts.vue` - Example admin CRUD interface
- `/stores/language.ts` - Global state patterns
- `/composables/useDataExport.ts` - Complex business logic patterns

When implementing features, follow the established patterns for authentication, database queries, type safety, and UI consistency.
