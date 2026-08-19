import { db, schema } from 'hub:db'
import { and, count, desc, eq, inArray } from 'drizzle-orm'
import { getPrimaryQuoteProvenance } from '~~/server/utils/quote-provenance'

export default defineEventHandler(async (event) => {
  try {
    const collectionId = Number(getRouterParam(event, 'id'))
    if (!Number.isInteger(collectionId)) throwServer(400, 'Invalid collection ID')

    const session = await getUserSession(event)
    const collection = await db.select({
      id: schema.userCollections.id,
      user_id: schema.userCollections.userId,
      is_public: schema.userCollections.isPublic,
      name: schema.userCollections.name,
      description: schema.userCollections.description,
      created_at: schema.userCollections.createdAt,
      updated_at: schema.userCollections.updatedAt,
      user_name: schema.users.name,
      user_avatar: schema.users.avatarUrl,
    })
      .from(schema.userCollections)
      .leftJoin(schema.users, eq(schema.userCollections.userId, schema.users.id))
      .where(eq(schema.userCollections.id, collectionId))
      .get()

    if (!collection) throwServer(404, 'Collection not found')

    const canAccess = collection.is_public || session.user?.id === collection.user_id
      || session.user?.role === 'admin' || session.user?.role === 'moderator'
    if (!canAccess) throwServer(403, 'Access denied')

    const query = getQuery(event)
    const page = parseInt(query.page as string) || 1
    const limit = Math.min(parseInt(query.limit as string) || 20, 50)
    const offset = (page - 1) * limit

    const [quotes, totalResult] = await Promise.all([
      db.select({
        id: schema.quotes.id,
        name: schema.quotes.name,
        language: schema.quotes.language,
        status: schema.quotes.status,
        userId: schema.quotes.userId,
        viewsCount: schema.quotes.viewsCount,
        likesCount: schema.quotes.likesCount,
        sharesCount: schema.quotes.sharesCount,
        isFeatured: schema.quotes.isFeatured,
        createdAt: schema.quotes.createdAt,
        updatedAt: schema.quotes.updatedAt,
        addedAt: schema.collectionQuotes.addedAt,
        user_name: schema.users.name,
      })
        .from(schema.collectionQuotes)
        .innerJoin(schema.quotes, eq(schema.collectionQuotes.quoteId, schema.quotes.id))
        .leftJoin(schema.users, eq(schema.quotes.userId, schema.users.id))
        .where(and(eq(schema.collectionQuotes.collectionId, collectionId), eq(schema.quotes.status, 'approved')))
        .orderBy(desc(schema.collectionQuotes.addedAt))
        .limit(limit)
        .offset(offset)
        .all(),
      db.select({ total: count() })
        .from(schema.collectionQuotes)
        .innerJoin(schema.quotes, eq(schema.collectionQuotes.quoteId, schema.quotes.id))
        .where(and(eq(schema.collectionQuotes.collectionId, collectionId), eq(schema.quotes.status, 'approved')))
        .get(),
    ])

    const [provenance, tagRows] = await Promise.all([
      getPrimaryQuoteProvenance(quotes.map(quote => quote.id)),
      quotes.length ? db.select({ quoteId: schema.quoteTags.quoteId, name: schema.tags.name, color: schema.tags.color })
        .from(schema.quoteTags)
        .innerJoin(schema.tags, eq(schema.quoteTags.tagId, schema.tags.id))
        .where(inArray(schema.quoteTags.quoteId, quotes.map(quote => quote.id)))
        .all() : [],
    ])
    const tagsByQuoteId: Record<number, Array<{ name: string, color: string | null }>> = {}
    for (const tag of tagRows) if (tag.quoteId !== null) (tagsByQuoteId[tag.quoteId] ??= []).push({ name: tag.name, color: tag.color })

    const total = Number(totalResult?.total) || 0
    return {
      success: true,
      data: {
        ...collection,
        quotes: quotes.map((quote) => {
          const quoteProvenance = provenance.get(quote.id)
          const attribution = quoteProvenance?.attributions.find(item => item.is_primary) ?? quoteProvenance?.attributions[0]
          return {
            ...quote,
            author: attribution?.author_id ? attribution.author : null,
            reference: attribution?.reference_id ? attribution.reference : null,
            attributions: quoteProvenance?.attributions ?? [],
            sources: quoteProvenance?.sources ?? [],
            tags: tagsByQuoteId[quote.id] ?? [],
          }
        }),
        quotes_count: total,
        pagination: { page, limit, total, hasMore: offset + quotes.length < total, totalPages: Math.ceil(total / limit) },
      },
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('Collection fetch error:', error)
    throwServer(500, 'Failed to fetch collection')
  }
})
