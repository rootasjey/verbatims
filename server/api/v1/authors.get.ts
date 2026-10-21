import { db, schema } from 'hub:db'
import { eq, desc, sql, count, like, inArray, and } from 'drizzle-orm'
import { getContentLanguage, localizeAuthors } from '~~/server/utils/entity-translations'

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
      birthYear: schema.authors.birthYear,
      birthEra: schema.authors.birthEra,
      birthMonth: schema.authors.birthMonth,
      birthDay: schema.authors.birthDay,
      birthIsApproximate: schema.authors.birthIsApproximate,
      birthCalendar: schema.authors.birthCalendar,
      deathDate: schema.authors.deathDate,
      deathYear: schema.authors.deathYear,
      deathEra: schema.authors.deathEra,
      deathMonth: schema.authors.deathMonth,
      deathDay: schema.authors.deathDay,
      deathIsApproximate: schema.authors.deathIsApproximate,
      deathCalendar: schema.authors.deathCalendar,
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
        .select({ authorId: schema.quoteAttributions.authorId, count: count() })
        .from(schema.quoteAttributions)
        .innerJoin(schema.quotes, eq(schema.quoteAttributions.quoteId, schema.quotes.id))
        .where(and(
          inArray(schema.quoteAttributions.authorId, authorIds),
          eq(schema.quotes.status, 'approved'),
        ))
        .groupBy(schema.quoteAttributions.authorId)
        .all()
      for (const c of counts) {
        if (c.authorId !== null) quotesCountMap[c.authorId] = c.count
      }
    }
  }

  const localizedAuthors = await localizeAuthors(authors, getContentLanguage(event))
  return {
    success: true,
    data: localizedAuthors.map(a => {
      const item: any = {
        id: a.id,
        name: a.name,
        fictional: a.isFictional,
        image_url: a.imageUrl,
        job: a.job,
        dates: {
          birth: a.birthDate,
          death: a.deathDate,
          birth_year: a.birthYear,
          birth_era: a.birthEra,
          birth_month: a.birthMonth,
          birth_day: a.birthDay,
          birth_is_approximate: a.birthIsApproximate,
          birth_calendar: a.birthCalendar,
          death_year: a.deathYear,
          death_era: a.deathEra,
          death_month: a.deathMonth,
          death_day: a.deathDay,
          death_is_approximate: a.deathIsApproximate,
          death_calendar: a.deathCalendar,
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
