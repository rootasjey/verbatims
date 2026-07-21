import { db, schema } from 'hub:db'
import { eq, desc, sql, count, like } from 'drizzle-orm'

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

  return {
    success: true,
    data: authors.map(a => ({
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
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    },
  }
})
