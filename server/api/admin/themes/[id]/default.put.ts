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
    const isDefault = body?.is_default === true

    await db.update(schema.themes)
      .set({ isDefault })
      .where(eq(schema.themes.id, themeId))

    return { success: true, data: { id: themeId, is_default: isDefault } }
  } catch (error: any) {
    if ((error as any).statusCode) throw error
    console.error('Error toggling theme default:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to toggle theme default' })
  }
})
