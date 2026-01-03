import { db, schema } from 'hub:db'
import { eq, or, like, count, desc, asc, sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!session.user || !['admin', 'moderator'].includes(session.user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }

  try {
    const query = getQuery(event)

    const page = parseInt(String(query.page || '1')) || 1
    const limit = Math.min(parseInt(String(query.limit || '50')) || 50, 100)
    const search = (query.search as string) || ''
    const sortByRaw = (query.sort_by as string) || 'name'
    const sortOrderRaw = ((query.sort_order as string) || 'ASC').toUpperCase()
    const sortOrder = sortOrderRaw === 'DESC' ? desc : asc

    const offset = (page - 1) * limit
    
    // Build WHERE conditions
    const conditions = []
    if (search) {
      conditions.push(
        or(
          like(schema.tags.name, `%${search}%`),
          like(schema.tags.description, `%${search}%`),
          like(schema.tags.category, `%${search}%`)
        )
      )
    }
    const whereCondition = conditions.length > 0 ? conditions[0] : undefined

    // Determine sort column
    let sortColumn
    if (sortByRaw === 'created_at') {
      sortColumn = schema.tags.createdAt
    } else if (sortByRaw === 'quotes') {
      sortColumn = sql<number>`quotes_count`
    } else {
      sortColumn = schema.tags.name
    }

    // Get tags with quote counts
    const rows = await db.select({
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
    .where(whereCondition)
    .groupBy(schema.tags.id)
    .orderBy(sortOrder(sortColumn))
    .limit(limit)
    .offset(offset)

    // Get total count
    const totalResult = await db.select({ total: count() })
      .from(schema.tags)
      .where(whereCondition)

    const total = Number(totalResult[0]?.total || 0)
    const totalPages = Math.ceil(total / limit)

    return {
      success: true,
      data: rows,
      pagination: { page, limit, total, totalPages, hasMore: page < totalPages }
    }
  } catch (error) {
    console.error('Error fetching admin tags:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch tags' })
  }
})
