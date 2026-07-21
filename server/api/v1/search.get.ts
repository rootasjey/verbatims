import { db, schema } from 'hub:db'
import { eq, and, or, like, desc, sql, count } from 'drizzle-orm'

defineRouteMeta({
  openAPI: {
    summary: 'Search quotes, authors, and references',
    description: 'Full-text search across multiple entity types.',
    tags: ['Search'],
    security: [{ apiKey: [] }],
    parameters: [
      { name: 'q', in: 'query', required: true, schema: { type: 'string' }, description: 'Search query (min 2 characters)' },
      { name: 'type', in: 'query', schema: { type: 'string', enum: ['quotes', 'authors', 'references'], default: 'quotes' } },
      { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
      { name: 'limit', in: 'query', schema: { type: 'integer', default: 20, maximum: 100 } },
    ],
    responses: { '200': { description: 'Search results with pagination' } },
  },
})

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const q = (query.q as string || '').trim()
  if (!q) throwServer(400, 'Search query (q) is required')
  if (q.length < 2) throwServer(400, 'Search query must be at least 2 characters')

  const page = parseInt(query.page as string) || 1
  const limit = Math.min(parseInt(query.limit as string) || 20, 100)
  const offset = (page - 1) * limit
  const type = (query.type as string) || 'quotes'

  const searchPattern = `%${q}%`

  if (type === 'authors') {
    const totalResult = await db
      .select({ total: count() })
      .from(schema.authors)
      .where(like(schema.authors.name, searchPattern))
      .get()

    const total = totalResult?.total || 0

    const authors = await db
      .select({
        id: schema.authors.id,
        name: schema.authors.name,
        imageUrl: schema.authors.imageUrl,
        job: schema.authors.job,
      })
      .from(schema.authors)
      .where(like(schema.authors.name, searchPattern))
      .orderBy(desc(schema.authors.viewsCount))
      .limit(limit)
      .offset(offset)
      .all()

    return {
      success: true,
      data: authors.map(a => ({ id: a.id, name: a.name, image_url: a.imageUrl, job: a.job, type: 'author' })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit), hasMore: page * limit < total },
    }
  }

  if (type === 'references') {
    const totalResult = await db
      .select({ total: count() })
      .from(schema.quoteReferences)
      .where(like(schema.quoteReferences.name, searchPattern))
      .get()

    const total = totalResult?.total || 0

    const refs = await db
      .select({
        id: schema.quoteReferences.id,
        name: schema.quoteReferences.name,
        primaryType: schema.quoteReferences.primaryType,
        imageUrl: schema.quoteReferences.imageUrl,
      })
      .from(schema.quoteReferences)
      .where(like(schema.quoteReferences.name, searchPattern))
      .orderBy(desc(schema.quoteReferences.viewsCount))
      .limit(limit)
      .offset(offset)
      .all()

    return {
      success: true,
      data: refs.map(r => ({ id: r.id, name: r.name, type: r.primaryType, image_url: r.imageUrl, entity_type: 'reference' })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit), hasMore: page * limit < total },
    }
  }

  // Default: search quotes
  const totalResult = await db
    .select({ total: count() })
    .from(schema.quotes)
    .leftJoin(schema.authors, eq(schema.quotes.authorId, schema.authors.id))
    .where(and(
      eq(schema.quotes.status, 'approved'),
      or(
        like(schema.quotes.name, searchPattern),
        like(schema.authors.name, searchPattern),
      ),
    ))
    .get()

  const total = totalResult?.total || 0

  const quotes = await db
    .select({
      id: schema.quotes.id,
      name: schema.quotes.name,
      language: schema.quotes.language,
      authorId: schema.quotes.authorId,
      referenceId: schema.quotes.referenceId,
      authorName: schema.authors.name,
      referenceName: schema.quoteReferences.name,
      referencePrimaryType: schema.quoteReferences.primaryType,
      createdAt: schema.quotes.createdAt,
    })
    .from(schema.quotes)
    .leftJoin(schema.authors, eq(schema.quotes.authorId, schema.authors.id))
    .leftJoin(schema.quoteReferences, eq(schema.quotes.referenceId, schema.quoteReferences.id))
    .where(and(
      eq(schema.quotes.status, 'approved'),
      or(
        like(schema.quotes.name, searchPattern),
        like(schema.authors.name, searchPattern),
      ),
    ))
    .orderBy(desc(schema.quotes.viewsCount))
    .limit(limit)
    .offset(offset)
    .all()

  return {
    success: true,
    data: quotes.map(q => ({
      id: q.id,
      content: q.name,
      language: q.language,
      author: q.authorId ? { id: q.authorId, name: q.authorName } : null,
      reference: q.referenceId ? { id: q.referenceId, name: q.referenceName, type: q.referencePrimaryType } : null,
      created_at: q.createdAt,
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
