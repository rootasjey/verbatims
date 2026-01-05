import { db, schema } from 'hub:db'
import { eq, asc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const quoteId = getRouterParam(event, 'id')
    if (!quoteId || isNaN(parseInt(quoteId))) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid quote ID' })
    }

    const rows = await db.select({
      id: schema.tags.id,
      name: schema.tags.name,
      color: schema.tags.color
    })
    .from(schema.tags)
    .innerJoin(schema.quoteTags, eq(schema.tags.id, schema.quoteTags.tagId))
    .where(eq(schema.quoteTags.quoteId, parseInt(quoteId)))
    .orderBy(asc(schema.tags.name))
    .all()

    return { success: true, data: rows }
  } catch (error) {
    console.error('Error fetching quote tags:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch quote tags' })
  }
})
