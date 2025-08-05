# Verbatims Agent Instructions

## Commands
- `bun run dev` - Development server (localhost:3000)
- `bun run build` - Production build
- `node scripts/test-migration-system.js` - Test database migrations
- `node scripts/test-admin-initialization.js` - Test admin initialization
- `node scripts/test-import-system.js` - Test data import system

## Architecture
- **Nuxt 3** app with **Cloudflare D1** database via **NuxtHub**
- **Auth**: nuxt-auth-utils with roles (user/moderator/admin)
- **UI**: UnaUI components + UnoCSS utility-first CSS
- **State**: Pinia stores for global state
- **API**: File-based routing in `/server/api/` using `getUserSession(event)` and `hubDatabase()`

## Code Style
- **TypeScript**: Strict typing with comprehensive types in `/types/`
- **Components**: Global auto-imported, use UnaUI primitives (`UButton`, `UCard`)
- **Imports**: Auto-imported composables, explicit imports for types
- **Database**: Use prepared statements with proper joins for D1 queries
- **Error Handling**: `throw createError({ statusCode, statusMessage })`
- **Auth Pattern**: Server `await getUserSession(event)`, client `const { user } = useUserSession()`
- **Styling**: UnaUI over custom CSS, dark mode with `dark:` prefixes
- **Props**: TypeScript interfaces with `defineProps<Props>()` and `withDefaults()`

Follow existing patterns in `.github/copilot-instructions.md` for detailed architecture guidance.
