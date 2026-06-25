import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!session.user || !['admin', 'moderator'].includes(session.user.role)) {
    throwServer(403, 'Admin access required')
  }

  try {
    const id = getRouterParam(event, 'id')
    if (!id || isNaN(parseInt(id))) {
      throwServer(400, 'Invalid theme ID')
    }
    const themeId = parseInt(id)
    const body = await readBody(event)
    const isActive = body?.is_active === true

    await db.update(schema.themes)
      .set({ isActive })
      .where(eq(schema.themes.id, themeId))

    return { success: true, data: { id: themeId, is_active: isActive } }
  } catch (error: any) {
    if ((error as any).statusCode) throw error
    console.error('Error toggling theme activation:', error)
    throwServer(500, 'Failed to toggle theme activation')
  }
})
