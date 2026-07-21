import { db, schema } from 'hub:db'
import { eq, desc, count, sql } from 'drizzle-orm'

defineRouteMeta({
  openAPI: {
    summary: 'List user collections',
    description: 'Returns paginated list of collections owned by the authenticated user.',
    tags: ['Collections'],
    security: [{ apiKey: [] }],
    parameters: [
      { name: 'page', in: 'query', schema: { type: 'integer', default: 1, minimum: 1 } },
      { name: 'limit', in: 'query', schema: { type: 'integer', default: 20, maximum: 50 } },
    ],
    responses: {
      '200': { description: 'Paginated list of collections' },
    },
  },
})

export default defineEventHandler(async (event) => {
  const api = event.context.api
  const query = getQuery(event)
  const page = parseInt(query.page as string) || 1
  const limit = Math.min(parseInt(query.limit as string) || 20, 50)
  const offset = (page - 1) * limit

  const totalResult = await db
    .select({ total: count() })
    .from(schema.userCollections)
    .where(eq(schema.userCollections.userId, api.userId))
    .get()

  const total = totalResult?.total || 0

  const collections = await db
    .select({
      id: schema.userCollections.id,
      name: schema.userCollections.name,
      description: schema.userCollections.description,
      isPublic: schema.userCollections.isPublic,
      createdAt: schema.userCollections.createdAt,
      updatedAt: schema.userCollections.updatedAt,
    })
    .from(schema.userCollections)
    .where(eq(schema.userCollections.userId, api.userId))
    .orderBy(desc(schema.userCollections.updatedAt))
    .limit(limit)
    .offset(offset)
    .all()

  const collectionIds = collections.map(c => c.id)
  const countsMap: Record<number, number> = {}
  if (collectionIds.length > 0) {
    const counts = await db
      .select({
        collectionId: schema.collectionQuotes.collectionId,
        total: count(),
      })
      .from(schema.collectionQuotes)
      .where(sql`${schema.collectionQuotes.collectionId} IN (${collectionIds.join(',')})`)
      .groupBy(schema.collectionQuotes.collectionId)
      .all()
    for (const c of counts) {
      countsMap[c.collectionId!] = c.total
    }
  }

  return {
    success: true,
    data: collections.map(c => ({
      id: c.id,
      name: c.name,
      description: c.description,
      is_public: c.isPublic,
      quotes_count: countsMap[c.id] || 0,
      created_at: c.createdAt,
      updated_at: c.updatedAt,
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
