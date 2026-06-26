import { db, schema } from 'hub:db'
import { eq, and, or, like, count, desc, asc, lte, gte, sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const { user } = await requireModerator(event)

  try {
    const query = getQuery(event)

    const page = parseInt(String(query.page || '1')) || 1
    const limit = Math.min(parseInt(String(query.limit || '50')) || 50, 100)
    const search = (query.search as string) || ''
    const sortByRaw = (query.sort_by as string) || 'priority'
    const sortOrderRaw = ((query.sort_order as string) || 'DESC').toUpperCase()
    const sortOrder = sortOrderRaw === 'DESC' ? desc : asc

    const offset = (page - 1) * limit

    const conditions = []
    if (search) {
      conditions.push(
        like(schema.sponsorMessages.message, `%${search}%`)
      )
    }
    const whereCondition = conditions.length > 0 ? conditions[0] : undefined

    let sortColumn
    if (sortByRaw === 'created_at') {
      sortColumn = schema.sponsorMessages.createdAt
    } else if (sortByRaw === 'priority') {
      sortColumn = schema.sponsorMessages.priority
    } else if (sortByRaw === 'updated_at') {
      sortColumn = schema.sponsorMessages.updatedAt
    } else {
      sortColumn = schema.sponsorMessages.priority
    }

    const rows = await db.select()
      .from(schema.sponsorMessages)
      .where(whereCondition)
      .orderBy(sortOrder(sortColumn))
      .limit(limit)
      .offset(offset)

    const totalResult = await db.select({ total: count() })
      .from(schema.sponsorMessages)
      .where(whereCondition)

    const total = Number(totalResult[0]?.total || 0)
    const totalPages = Math.ceil(total / limit)

    // Count currently active messages (isActive + within date range)
    const now = new Date().toISOString().slice(0, 16)
    const activeResult = await db.select({ activeCount: count() })
      .from(schema.sponsorMessages)
      .where(
        and(
          eq(schema.sponsorMessages.isActive, true),
          or(sql`${schema.sponsorMessages.startsAt} IS NULL`, lte(schema.sponsorMessages.startsAt, now)),
          or(sql`${schema.sponsorMessages.endsAt} IS NULL`, gte(schema.sponsorMessages.endsAt, now))
        )
      )

    const activeCount = Number(activeResult[0]?.activeCount || 0)

    return {
      success: true,
      data: {
        sponsors: rows,
        ...(activeCount ? { activeCount } : {})
      },
      pagination: { page, limit, total, totalPages, hasMore: page < totalPages }
    }
  } catch (error) {
    console.error('Error fetching admin sponsors:', error)
    throwServer(500, 'Failed to fetch sponsor messages')
  }
})
