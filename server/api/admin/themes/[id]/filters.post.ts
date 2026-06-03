import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!session.user || !['admin', 'moderator'].includes(session.user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }

  try {
    const id = getRouterParam(event, 'id')
    if (!id || isNaN(parseInt(id))) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid theme ID' })
    }
    const themeId = parseInt(id)
    const body = await readBody(event)

    const type = body?.type as string
    const value = String(body?.value || '').trim()
    const matchMode = body?.match_mode || 'any'

    const validTypes = ['keyword', 'tag_name', 'author_name', 'reference_name', 'author_id', 'reference_id']
    if (!type || !validTypes.includes(type)) {
      throw createError({ statusCode: 400, statusMessage: `Invalid filter type. Must be one of: ${validTypes.join(', ')}` })
    }
    if (!value || value.length < 1) {
      throw createError({ statusCode: 400, statusMessage: 'Filter value is required' })
    }

    const theme = await db.select({ id: schema.themes.id })
      .from(schema.themes)
      .where(eq(schema.themes.id, themeId))
      .limit(1)

    if (!theme || theme.length === 0) {
      throw createError({ statusCode: 404, statusMessage: 'Theme not found' })
    }

    const result = await db.insert(schema.themeContentFilters).values({
      themeId,
      type: type as any,
      value,
      matchMode,
    }).returning()

    return { success: true, data: result[0] }
  } catch (error: any) {
    if ((error as any).statusCode) throw error
    console.error('Error adding theme filter:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to add theme filter' })
  }
})
