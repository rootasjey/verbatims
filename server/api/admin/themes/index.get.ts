import { db, schema } from 'hub:db'
import { eq, or, and, like, count, desc, asc, inArray } from 'drizzle-orm'

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
    } else {
      sortColumn = schema.themes.priority
    }

    const rows = await db.select({
      id: schema.themes.id,
      slug: schema.themes.slug,
      name: schema.themes.name,
      description: schema.themes.description,
      isActive: schema.themes.isActive,
      isDefault: schema.themes.isDefault,
      scheduledStart: schema.themes.scheduledStart,
      scheduledEnd: schema.themes.scheduledEnd,
      priority: schema.themes.priority,
      config: schema.themes.config,
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

    // Fetch pending suggestions count per theme
    const themeIds = rows.map(r => r.id)
    let pendingCounts = new Map<number, number>()
    if (themeIds.length > 0) {
      const counts = await db.select({
        themeId: schema.entitySuggestions.themeId,
        total: count(),
      })
        .from(schema.entitySuggestions)
        .where(and(
          eq(schema.entitySuggestions.status, 'pending'),
          inArray(schema.entitySuggestions.themeId, themeIds as any),
        ))
        .groupBy(schema.entitySuggestions.themeId)
        .all()
      for (const c of counts) {
        pendingCounts.set(c.themeId, c.total)
      }
    }

    const data = rows.map(r => ({
      ...r,
      pending_suggestions_count: pendingCounts.get(r.id) || 0,
    }))

    return {
      success: true,
      data,
      pagination: { page, limit, total, totalPages, hasMore: page < totalPages },
    }
  } catch (error) {
    console.error('Error fetching themes:', error)
    throwServer(500, 'Failed to fetch themes')
  }
})
