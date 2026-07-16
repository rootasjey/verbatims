import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'
import { enrichThemeFilters } from '~~/server/utils/theme-enrichment'
import { scheduleBackground } from '~~/server/utils/schedule'

export default defineEventHandler(async (event) => {
  const { user } = await requireModerator(event)

  try {
    const id = getRouterParam(event, 'id')!
    if (!id || isNaN(parseInt(id))) {
      throwServer(400, 'Invalid theme ID')
    }
    const themeId = parseInt(id)
    const body = await readBody(event)

    const type = body?.type as string
    const value = String(body?.value || '').trim()
    const matchMode = body?.match_mode || 'any'

    const validTypes = ['keyword', 'tag_name', 'author_name', 'reference_name', 'author_id', 'reference_id']
    if (!type || !validTypes.includes(type)) {
      throwServer(400, `Invalid filter type. Must be one of: ${validTypes.join(', ')}`)
    }
    if (!value || value.length < 1) {
      throwServer(400, 'Filter value is required')
    }

    const theme = await db.select({ id: schema.themes.id })
      .from(schema.themes)
      .where(eq(schema.themes.id, themeId))
      .limit(1)

    if (!theme || theme.length === 0) {
      throwServer(404, 'Theme not found')
    }

    const result = await db.insert(schema.themeContentFilters).values({
      themeId,
      type: type as any,
      value,
      matchMode,
    }).returning()

    // Background enrichment: validate + find co-occurring filters
    scheduleBackground(event, enrichThemeFilters(themeId, user.id))

    return { success: true, data: result[0] }
  } catch (error: any) {
    if ((error as any).statusCode) throw error
    console.error('Error adding theme filter:', error)
    throwServer(500, 'Failed to add theme filter')
  }
})
