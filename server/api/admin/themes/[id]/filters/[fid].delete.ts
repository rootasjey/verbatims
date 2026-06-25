import { db, schema } from 'hub:db'
import { eq, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!session.user || !['admin', 'moderator'].includes(session.user.role)) {
    throwServer(403, 'Admin access required')
  }

  try {
    const id = getRouterParam(event, 'id')!
    const fid = getRouterParam(event, 'fid')!
    if (!id || isNaN(parseInt(id)) || !fid || isNaN(parseInt(fid))) {
      throwServer(400, 'Invalid theme ID or filter ID')
    }
    const themeId = parseInt(id)
    const filterId = parseInt(fid)

    const existing = await db.select({ id: schema.themeContentFilters.id })
      .from(schema.themeContentFilters)
      .where(and(
        eq(schema.themeContentFilters.id, filterId),
        eq(schema.themeContentFilters.themeId, themeId)
      ))
      .limit(1)

    if (!existing || existing.length === 0) {
      throwServer(404, 'Filter not found')
    }

    await db.delete(schema.themeContentFilters)
      .where(eq(schema.themeContentFilters.id, filterId))

    return { success: true, data: { deleted: true } }
  } catch (error: any) {
    if ((error as any).statusCode) throw error
    console.error('Error deleting theme filter:', error)
    throwServer(500, 'Failed to delete theme filter')
  }
})
