import { db, schema } from 'hub:db'
import { and, eq, desc, count, inArray, sql } from 'drizzle-orm'
import { getPrimaryQuoteProvenance } from '~~/server/utils/quote-provenance'

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

  const quotes = await db.select({
    id: schema.quotes.id,
    content: schema.quotes.name,
    language: schema.quotes.language,
    viewsCount: schema.quotes.viewsCount,
    likesCount: schema.quotes.likesCount,
    sharesCount: schema.quotes.sharesCount,
    isFeatured: schema.quotes.isFeatured,
    createdAt: schema.quotes.createdAt,
    updatedAt: schema.quotes.updatedAt,
    addedAt: schema.collectionQuotes.addedAt,
  })
    .from(schema.collectionQuotes)
    .innerJoin(schema.quotes, eq(schema.collectionQuotes.quoteId, schema.quotes.id))
    .where(and(eq(schema.collectionQuotes.collectionId, collectionId), eq(schema.quotes.status, 'approved')))
    .orderBy(desc(schema.collectionQuotes.addedAt))
    .limit(limit)
    .offset(offset)
    .all()

  const [provenance, tagRows] = await Promise.all([
    getPrimaryQuoteProvenance(quotes.map(quote => quote.id)),
    quotes.length
      ? db.select({ quoteId: schema.quoteTags.quoteId, name: schema.tags.name, color: schema.tags.color })
        .from(schema.quoteTags)
        .innerJoin(schema.tags, eq(schema.quoteTags.tagId, schema.tags.id))
        .where(inArray(schema.quoteTags.quoteId, quotes.map(quote => quote.id)))
        .all()
      : [],
  ])
  const tagsByQuoteId: Record<number, Array<{ name: string, color: string | null }>> = {}
  for (const tag of tagRows) {
    if (tag.quoteId !== null) (tagsByQuoteId[tag.quoteId] ??= []).push({ name: tag.name, color: tag.color })
  }

  const processedQuotes = quotes.map((quote) => {
    const quoteProvenance = provenance.get(quote.id)
    const attribution = quoteProvenance?.attributions.find(item => item.is_primary) ?? quoteProvenance?.attributions[0]
    return {
      id: quote.id,
      content: quote.content,
      language: quote.language,
      stats: { views: quote.viewsCount, likes: quote.likesCount, shares: quote.sharesCount },
      featured: !!quote.isFeatured,
      author: attribution?.author_id ? attribution.author : null,
      reference: attribution?.reference_id ? attribution.reference : null,
      attributions: quoteProvenance?.attributions ?? [],
      sources: quoteProvenance?.sources ?? [],
      tags: tagsByQuoteId[quote.id] ?? [],
      added_at: quote.addedAt,
      created_at: quote.createdAt,
      updated_at: quote.updatedAt,
    }
  })

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
