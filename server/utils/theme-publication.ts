import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'
import type { H3Event } from 'h3'
import { getThemeCacheControl, isThemePublished } from './theme-publication-policy'

export async function getThemeForPublicAccess(event: H3Event, slug: string) {
  const theme = await db.select()
    .from(schema.themes)
    .where(eq(schema.themes.slug, slug))
    .limit(1)
    .get()

  if (!theme) return null
  if (isThemePublished(theme.publicationStatus)) return { theme, isDraftPreview: false }

  const session = await getUserSession(event)
  if (session.user?.role !== 'moderator' && session.user?.role !== 'admin') return null

  return { theme, isDraftPreview: true }
}

export function setThemeResponseCache(event: H3Event, isDraftPreview: boolean): void {
  setResponseHeader(event, 'Cache-Control', getThemeCacheControl(isDraftPreview))
}
