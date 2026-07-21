import { db, schema } from 'hub:db'
import { desc, count, sql } from 'drizzle-orm'

defineRouteMeta({
  openAPI: {
    summary: 'List tags',
    description: 'Paginated list of tags with usage counts.',
    tags: ['Tags'],
    security: [{ apiKey: [] }],
    parameters: [
      { name: 'page', in: 'query', schema: { type: 'integer', default: 1, minimum: 1 } },
      { name: 'limit', in: 'query', schema: { type: 'integer', default: 50, maximum: 100 } },
    ],
    responses: {
      '200': { description: 'Paginated list of tags' },
    },
  },
})

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const page = parseInt(query.page as string) || 1
  const limit = Math.min(parseInt(query.limit as string) || 50, 100)
  const offset = (page - 1) * limit

  const totalResult = await db
    .select({ total: count() })
    .from(schema.tags)
    .get()

  const total = totalResult?.total || 0

  const tags = await db
    .select({
      id: schema.tags.id,
      name: schema.tags.name,
      description: schema.tags.description,
      category: schema.tags.category,
      color: schema.tags.color,
      quoteCount: sql<number>`(SELECT COUNT(*) FROM ${schema.quoteTags} WHERE ${schema.quoteTags.tagId} = ${schema.tags.id})`.as('quote_count'),
    })
    .from(schema.tags)
    .orderBy(desc(sql`quote_count`))
    .limit(limit)
    .offset(offset)
    .all()

  return {
    success: true,
    data: tags.map(t => ({
      id: t.id,
      name: t.name,
      description: t.description,
      category: t.category,
      color: t.color,
      quote_count: t.quoteCount,
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
