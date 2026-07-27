import { db, schema } from 'hub:db'
import { eq, desc, sql, count, like, inArray, and } from 'drizzle-orm'

defineRouteMeta({
  openAPI: {
    summary: 'List authors',
    description: 'Paginated list of authors with optional search.',
    tags: ['Authors'],
    security: [{ apiKey: [] }],
    parameters: [
      { name: 'page', in: 'query', schema: { type: 'integer', default: 1, minimum: 1 } },
      { name: 'limit', in: 'query', schema: { type: 'integer', default: 20, maximum: 100 } },
      { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Search by name' },
      { name: 'include', in: 'query', schema: { type: 'string' }, description: 'Comma-separated fields to include (e.g. quotes_count)' },
    ],
    responses: { '200': { description: 'Paginated list of authors' } },
  },
})

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const page = parseInt(query.page as string) || 1
  const limit = Math.min(parseInt(query.limit as string) || 20, 100)
  const offset = (page - 1) * limit
  const search = query.search as string | undefined
  const include = ((query.include as string) || '').split(',').map(s => s.trim()).filter(Boolean)

  const conditions = []
  if (search) conditions.push(like(schema.authors.name, `%${search}%`))

  const where = conditions.length > 0 ? sql.join(conditions, sql` AND `) : undefined

  const totalResult = await db
    .select({ total: count() })
    .from(schema.authors)
    .where(where)
    .get()

  const total = totalResult?.total || 0

  const authors = await db
    .select({
      id: schema.authors.id,
      name: schema.authors.name,
      isFictional: schema.authors.isFictional,
      imageUrl: schema.authors.imageUrl,
      job: schema.authors.job,
      birthDate: schema.authors.birthDate,
      deathDate: schema.authors.deathDate,
      birthLocation: schema.authors.birthLocation,
      deathLocation: schema.authors.deathLocation,
      description: schema.authors.description,
      viewsCount: schema.authors.viewsCount,
      likesCount: schema.authors.likesCount,
      createdAt: schema.authors.createdAt,
    })
    .from(schema.authors)
    .where(where)
    .orderBy(desc(schema.authors.viewsCount))
    .limit(limit)
    .offset(offset)
    .all()

  let quotesCountMap: Record<number, number> = {}
  if (include.includes('quotes_count')) {
    const authorIds = authors.map(a => a.id)
    if (authorIds.length > 0) {
      const counts = await db
        .select({ authorId: schema.quotes.authorId, count: count() })
        .from(schema.quotes)
        .where(and(
          inArray(schema.quotes.authorId, authorIds),
          eq(schema.quotes.status, 'approved'),
        ))
        .groupBy(schema.quotes.authorId)
        .all()
      for (const c of counts) {
        if (c.authorId !== null) quotesCountMap[c.authorId] = c.count
      }
    }
  }

  return {
    success: true,
    data: authors.map(a => {
      const item: any = {
        id: a.id,
        name: a.name,
        fictional: a.isFictional,
        image_url: a.imageUrl,
        job: a.job,
        dates: {
          birth: a.birthDate,
          death: a.deathDate,
          birth_location: a.birthLocation,
          death_location: a.deathLocation,
        },
        description: a.description,
        stats: { views: a.viewsCount, likes: a.likesCount },
        created_at: a.createdAt,
      }
      if (include.includes('quotes_count')) {
        item.quotes_count = quotesCountMap[a.id] || 0
      }
      return item
    }),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    },
  }
})
