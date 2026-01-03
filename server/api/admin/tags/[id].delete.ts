import { db, schema } from 'hub:db'
import { eq, count } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!session.user || !['admin', 'moderator'].includes(session.user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }

  try {
    const id = getRouterParam(event, 'id')
    if (!id || isNaN(parseInt(id))) throw createError({ statusCode: 400, statusMessage: 'Invalid tag ID' })
    const tagId = parseInt(id)

    // Optionally, we could check usage count and return it
    const usageResult = await db.select({ count: count() })
      .from(schema.quoteTags)
      .where(eq(schema.quoteTags.tagId, tagId))
    
    const usage = Number(usageResult[0]?.count || 0)

    await db.delete(schema.tags).where(eq(schema.tags.id, tagId))

    return { success: true, data: { deleted: true, usage } }
  } catch (error: any) {
    if ((error as any).statusCode) throw error
    console.error('Error deleting tag:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to delete tag' })
  }
})
