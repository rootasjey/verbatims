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

    const existing = await db.select({ id: schema.themes.id })
      .from(schema.themes)
      .where(eq(schema.themes.id, themeId))
      .limit(1)

    if (!existing || existing.length === 0) {
      throw createError({ statusCode: 404, statusMessage: 'Theme not found' })
    }

    await db.delete(schema.themes).where(eq(schema.themes.id, themeId))

    return { success: true, data: { deleted: true } }
  } catch (error: any) {
    if ((error as any).statusCode) throw error
    console.error('Error deleting theme:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to delete theme' })
  }
})
