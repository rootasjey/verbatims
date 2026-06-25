import { db, schema } from 'hub:db'
import { eq, count, sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!session.user || !['admin', 'moderator'].includes(session.user.role)) {
    throwServer(403, 'Admin access required')
  }

  const id = getRouterParam(event, 'id')!
  if (!id || isNaN(parseInt(id))) {
    throwServer(400, 'Invalid tag ID')
  }
  const tagId = parseInt(id)

  try {
    const row = await db.select({
      id: schema.tags.id,
      name: schema.tags.name,
      description: schema.tags.description,
      category: schema.tags.category,
      color: schema.tags.color,
      created_at: schema.tags.createdAt,
      updated_at: schema.tags.updatedAt,
      quotes_count: sql<number>`COUNT(${schema.quoteTags.quoteId})`.as('quotes_count')
    })
    .from(schema.tags)
    .leftJoin(schema.quoteTags, eq(schema.tags.id, schema.quoteTags.tagId))
    .where(eq(schema.tags.id, tagId))
    .groupBy(schema.tags.id)
    .limit(1)
    
    if (!row || row.length === 0) throwServer(404, 'Tag not found')

    return { success: true, data: row[0] }
  } catch (error: any) {
    if ((error as any).statusCode) throw error
    console.error('Error fetching tag by id:', error)
    throwServer(500, 'Failed to fetch tag')
  }
})
