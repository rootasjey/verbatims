import { db, schema } from 'hub:db'
import { eq, count } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const { user } = await requireModerator(event)

  try {
    const id = getRouterParam(event, 'id')!
    if (!id || isNaN(parseInt(id))) throwServer(400, 'Invalid tag ID')
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
    throwServer(500, 'Failed to delete tag')
  }
})
