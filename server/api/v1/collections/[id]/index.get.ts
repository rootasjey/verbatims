import { db, schema } from 'hub:db'
import { eq, desc, count, sql } from 'drizzle-orm'

defineRouteMeta({
  openAPI: {
    summary: 'Get a collection',
    description: 'Returns a collection with its quotes. The collection must be public or owned by the authenticated user.',
    tags: ['Collections'],
    security: [{ apiKey: [] }],
    parameters: [
      { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'Collection ID' },
      { name: 'page', in: 'query', schema: { type: 'integer', default: 1, minimum: 1 } },
      { name: 'limit', in: 'query', schema: { type: 'integer', default: 20, maximum: 50 } },
    ],
    responses: {
      '200': { description: 'Collection details with quotes' },
      '403': { description: 'Access denied' },
      '404': { description: 'Collection not found' },
    },
  },
})

export default defineEventHandler(async (event) => {
  const api = event.context.api
  const collectionId = parseInt(getRouterParam(event, 'id') || '')
  if (isNaN(collectionId)) throwServer(400, 'Invalid collection ID')

  const collection = await db
    .select({
      id: schema.userCollections.id,
      name: schema.userCollections.name,
      description: schema.userCollections.description,
      isPublic: schema.userCollections.isPublic,
      userId: schema.userCollections.userId,
      createdAt: schema.userCollections.createdAt,
      updatedAt: schema.userCollections.updatedAt,
    })
    .from(schema.userCollections)
    .where(eq(schema.userCollections.id, collectionId))
    .get()

  if (!collection) throwServer(404, 'Collection not found')

  const canAccess = collection.isPublic || collection.userId === api.userId
  if (!canAccess) throwServer(403, 'Access denied')

  const query = getQuery(event)
  const page = parseInt(query.page as string) || 1
  const limit = Math.min(parseInt(query.limit as string) || 20, 50)
  const offset = (page - 1) * limit

  const totalResult = await db
    .select({ total: count() })
    .from(schema.collectionQuotes)
    .innerJoin(schema.quotes, eq(schema.collectionQuotes.quoteId, schema.quotes.id))
    .where(sql`${schema.collectionQuotes.collectionId} = ${collectionId} AND ${schema.quotes.status} = 'approved'`)
    .get()

  const total = Number(totalResult?.total) || 0

  const quotes = await db.all(sql`
    SELECT
      q.id, q.name as content, q.language,
      q.views_count as viewsCount, q.likes_count as likesCount, q.shares_count as sharesCount,
      q.is_featured as isFeatured, q.created_at as createdAt, q.updated_at as updatedAt,
      a.id as authorId, a.name as authorName, a.is_fictional as authorIsFictional, a.image_url as authorImageUrl,
      r.name as referenceName, r.primary_type as referenceType,
      cq.added_at as addedAt,
      GROUP_CONCAT(t.name) as tagNames,
      GROUP_CONCAT(t.color) as tagColors
    FROM ${schema.collectionQuotes} cq
    JOIN ${schema.quotes} q ON cq.quote_id = q.id
    LEFT JOIN ${schema.authors} a ON q.author_id = a.id
    LEFT JOIN ${schema.quoteReferences} r ON q.reference_id = r.id
    LEFT JOIN ${schema.quoteTags} qt ON q.id = qt.quote_id
    LEFT JOIN ${schema.tags} t ON qt.tag_id = t.id
    WHERE cq.collection_id = ${collectionId} AND q.status = 'approved'
    GROUP BY q.id
    ORDER BY cq.added_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `)

  const processedQuotes = (quotes || []).map((q: any) => ({
    id: q.id,
    content: q.content,
    language: q.language,
    stats: { views: q.viewsCount, likes: q.likesCount, shares: q.sharesCount },
    featured: !!q.isFeatured,
    author: q.authorId ? { id: q.authorId, name: q.authorName, fictional: !!q.authorIsFictional, image_url: q.authorImageUrl } : null,
    reference: q.referenceId ? { id: q.referenceId, name: q.referenceName, type: q.referenceType } : null,
    tags: parseTags(q.tagNames, q.tagColors),
    added_at: q.addedAt,
    created_at: q.createdAt,
    updated_at: q.updatedAt,
  }))

  return {
    success: true,
    data: {
      id: collection.id,
      name: collection.name,
      description: collection.description,
      is_public: collection.isPublic,
      quotes_count: total,
      quotes: processedQuotes,
      created_at: collection.createdAt,
      updated_at: collection.updatedAt,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    },
  }
})
