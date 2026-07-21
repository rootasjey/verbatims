import { db, schema } from 'hub:db'
import { eq, and, desc, sql, count } from 'drizzle-orm'

defineRouteMeta({
  openAPI: {
    summary: 'List approved quotes',
    description: 'Paginated list of approved quotes with optional filtering.',
    tags: ['Quotes'],
    security: [{ apiKey: [] }],
    parameters: [
      { name: 'page', in: 'query', schema: { type: 'integer', default: 1, minimum: 1 } },
      { name: 'limit', in: 'query', schema: { type: 'integer', default: 20, maximum: 100 } },
      { name: 'language', in: 'query', schema: { type: 'string', enum: ['en', 'fr', 'es', 'de', 'it', 'pt', 'ru', 'ja', 'zh', 'la', 'ar', 'ko'] }, description: 'Filter by language code' },
      { name: 'author_id', in: 'query', schema: { type: 'integer' }, description: 'Filter by author ID' },
      { name: 'reference_id', in: 'query', schema: { type: 'integer' }, description: 'Filter by reference ID' },
      { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Search quote content' },
      { name: 'tag', in: 'query', schema: { type: 'string' }, description: 'Filter by tag name' },
      { name: 'sort_by', in: 'query', schema: { type: 'string', enum: ['created_at', 'updated_at', 'views_count', 'likes_count', 'shares_count', 'name'], default: 'created_at' } },
      { name: 'sort_order', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' } },
    ],
    responses: {
      '200': {
        description: 'Paginated list of quotes',
        content: {
          'application/json': {
            example: { success: true, data: [{ id: 1, content: '...', language: 'en', stats: { views: 42, likes: 7, shares: 3 }, featured: false, author: { id: 1, name: 'Author', fictional: false, image_url: null, description: null }, reference: null, tags: [], created_at: '...', updated_at: '...' }], pagination: { page: 1, limit: 20, total: 100, totalPages: 5, hasMore: true } },
          },
        },
      },
    },
  },
})

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const page = parseInt(query.page as string) || 1
  const limit = Math.min(parseInt(query.limit as string) || 20, 100)
  const offset = (page - 1) * limit
  const language = query.language as string | undefined
  const authorId = query.author_id ? parseInt(query.author_id as string) : undefined
  const referenceId = query.reference_id ? parseInt(query.reference_id as string) : undefined
  const search = query.search as string | undefined
  const tag = query.tag as string | undefined
  const sortBy = (query.sort_by as string) || 'created_at'
  const sortOrder = (query.sort_order as string)?.toLowerCase() === 'asc' ? 'asc' : 'desc'

  const validSortFields = ['created_at', 'updated_at', 'views_count', 'likes_count', 'shares_count', 'name']
  const safeSortBy = validSortFields.includes(sortBy) ? sortBy : 'created_at'
  const orderColumn = sql.raw(`quotes.${safeSortBy}`)

  const conditions = [eq(schema.quotes.status, 'approved')]
  if (language) conditions.push(eq(schema.quotes.language, language as any))
  if (authorId) conditions.push(eq(schema.quotes.authorId, authorId))
  if (referenceId) conditions.push(eq(schema.quotes.referenceId, referenceId))

  let tagJoin = null
  if (tag) {
    tagJoin = db.select({ quoteId: schema.quoteTags.quoteId })
      .from(schema.quoteTags)
      .innerJoin(schema.tags, eq(schema.quoteTags.tagId, schema.tags.id))
      .where(eq(schema.tags.name, tag))
      .as('tag_filter')
  }

  const totalResult = await db
    .select({ total: count() })
    .from(schema.quotes)
    .where(and(...conditions))
    .get()

  const total = totalResult?.total || 0

  let baseQuery = db
    .select({
      id: schema.quotes.id,
      name: schema.quotes.name,
      language: schema.quotes.language,
      viewsCount: schema.quotes.viewsCount,
      likesCount: schema.quotes.likesCount,
      sharesCount: schema.quotes.sharesCount,
      isFeatured: schema.quotes.isFeatured,
      createdAt: schema.quotes.createdAt,
      updatedAt: schema.quotes.updatedAt,
      authorId: schema.quotes.authorId,
      referenceId: schema.quotes.referenceId,
      authorName: schema.authors.name,
      authorIsFictional: schema.authors.isFictional,
      authorImageUrl: schema.authors.imageUrl,
      referenceName: schema.quoteReferences.name,
      referencePrimaryType: schema.quoteReferences.primaryType,
    })
    .from(schema.quotes)
    .leftJoin(schema.authors, eq(schema.quotes.authorId, schema.authors.id))
    .leftJoin(schema.quoteReferences, eq(schema.quotes.referenceId, schema.quoteReferences.id))
    .where(and(...conditions))

  if (tag && tagJoin) {
    baseQuery = baseQuery.innerJoin(tagJoin, eq(schema.quotes.id, tagJoin.quoteId))
  }

  const quotes = await baseQuery
    .orderBy(sortOrder === 'asc' ? sql`${orderColumn} ASC` : sql`${orderColumn} DESC`)
    .limit(limit)
    .offset(offset)
    .all()

  const quoteIds = quotes.map(q => q.id)
  const tagsMap: Record<number, { name: string; color: string | null }[]> = {}
  if (quoteIds.length > 0) {
    const tags = await db
      .select({
        quoteId: schema.quoteTags.quoteId,
        name: schema.tags.name,
        color: schema.tags.color,
      })
      .from(schema.quoteTags)
      .innerJoin(schema.tags, eq(schema.quoteTags.tagId, schema.tags.id))
      .where(sql`${schema.quoteTags.quoteId} IN (${quoteIds.join(',')})`)
      .all()
    for (const t of tags) {
      const qid = t.quoteId!
      if (!tagsMap[qid]) tagsMap[qid] = []
      tagsMap[qid].push({ name: t.name, color: t.color })
    }
  }

  const data = quotes.map(q => ({
    id: q.id,
    content: q.name,
    language: q.language,
    stats: {
      views: q.viewsCount,
      likes: q.likesCount,
      shares: q.sharesCount,
    },
    featured: q.isFeatured,
    author: q.authorId ? {
      id: q.authorId,
      name: q.authorName,
      fictional: q.authorIsFictional,
      image_url: q.authorImageUrl,
    } : null,
    reference: q.referenceId ? {
      id: q.referenceId,
      name: q.referenceName,
      type: q.referencePrimaryType,
    } : null,
    tags: tagsMap[q.id] || [],
    created_at: q.createdAt,
    updated_at: q.updatedAt,
  }))

  return {
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    },
  }
})
