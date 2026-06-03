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

    const theme = await db.select()
      .from(schema.themes)
      .where(eq(schema.themes.id, themeId))
      .limit(1)
      .get()

    if (!theme) {
      throw createError({ statusCode: 404, statusMessage: 'Theme not found' })
    }

    const filters = await db.select()
      .from(schema.themeContentFilters)
      .where(eq(schema.themeContentFilters.themeId, themeId))
      .all()

    return {
      success: true,
      data: { ...theme, filters },
    }
  } catch (error: any) {
    if ((error as any).statusCode) throw error
    console.error('Error fetching theme:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch theme' })
  }
})
