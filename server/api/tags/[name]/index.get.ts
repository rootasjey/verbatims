import { db, schema } from 'hub:db'
import { eq, and, sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const rawName = getRouterParam(event, 'name')
    const decodedName = rawName ? decodeURIComponent(rawName).trim() : ''

    if (!decodedName) {
      throwServer(400, 'Invalid tag name')
      return
    }

    const tag = await db
      .select()
      .from(schema.tags)
      .where(sql`LOWER(${schema.tags.name}) = LOWER(${decodedName})`)
      .get()

    if (!tag) {
      throwServer(404, 'Tag not found')
      return
    }

    const quotesCountResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(schema.quoteTags)
      .innerJoin(schema.quotes, eq(schema.quoteTags.quoteId, schema.quotes.id))
      .where(and(
        eq(schema.quoteTags.tagId, tag.id),
        eq(schema.quotes.status, 'approved')
      ))
      .get()

    const toISO = (input: any) => {
      if (!input) return ''
      const d = new Date(input)
      if (isNaN(d.getTime())) return ''
      return d.toISOString()
    }

    const response: ApiResponse<TagWithStats> = {
      success: true,
      data: {
        id: Number(tag.id),
        name: tag.name,
        description: tag.description ?? null,
        category: tag.category ?? null,
        color: tag.color,
        created_at: toISO(tag.createdAt),
        updated_at: toISO(tag.updatedAt),
        usage_count: Number(quotesCountResult?.count ?? 0)
      }
    }

    return response
  } catch (error: any) {
    if (error?.statusCode) throw error
    console.error('Error fetching tag by name:', error)
    throwServer(500, 'Failed to fetch tag')
  }
})
