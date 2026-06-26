import { db, schema } from 'hub:db'
import { eq, or, like, count, desc, asc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const { user } = await requireModerator(event)

  try {
    const query = getQuery(event)
    const page = Math.max(parseInt(String(query.page || '1')), 1)
    const limit = Math.min(parseInt(String(query.limit || '50')), 100)
    const search = (query.search as string) || ''
    const sortByRaw = (query.sort_by as string) || 'priority'
    const sortOrderRaw = ((query.sort_order as string) || 'DESC').toUpperCase()
    const sortOrder = sortOrderRaw === 'ASC' ? asc : desc
    const offset = (page - 1) * limit

    const conditions: any[] = []
    if (search) {
      conditions.push(
        or(
          like(schema.themes.name, `%${search}%`),
          like(schema.themes.slug, `%${search}%`),
          like(schema.themes.description, `%${search}%`)
        )
      )
    }
    const whereCondition = conditions.length > 0 ? conditions[0] : undefined

    let sortColumn
    if (sortByRaw === 'name') {
      sortColumn = schema.themes.name
    } else if (sortByRaw === 'slug') {
      sortColumn = schema.themes.slug
    } else if (sortByRaw === 'scheduled_date') {
      sortColumn = schema.themes.scheduledDate
    } else {
      sortColumn = schema.themes.priority
    }

    const rows = await db.select({
      id: schema.themes.id,
      slug: schema.themes.slug,
      name: schema.themes.name,
      description: schema.themes.description,
      imageUrl: schema.themes.imageUrl,
      isActive: schema.themes.isActive,
      isDefault: schema.themes.isDefault,
      scheduledDate: schema.themes.scheduledDate,
      scheduledStart: schema.themes.scheduledStart,
      scheduledEnd: schema.themes.scheduledEnd,
      priority: schema.themes.priority,
      createdAt: schema.themes.createdAt,
      updatedAt: schema.themes.updatedAt,
      filters_count: count(schema.themeContentFilters.id).as('filters_count'),
    })
      .from(schema.themes)
      .leftJoin(schema.themeContentFilters, eq(schema.themes.id, schema.themeContentFilters.themeId))
      .where(whereCondition)
      .groupBy(schema.themes.id)
      .orderBy(sortOrder(sortColumn))
      .limit(limit)
      .offset(offset)
      .all()

    const totalResult = await db.select({ total: count() })
      .from(schema.themes)
      .where(whereCondition)

    const total = Number(totalResult[0]?.total || 0)
    const totalPages = Math.ceil(total / limit)

    return {
      success: true,
      data: rows,
      pagination: { page, limit, total, totalPages, hasMore: page < totalPages },
    }
  } catch (error) {
    console.error('Error fetching themes:', error)
    throwServer(500, 'Failed to fetch themes')
  }
})
