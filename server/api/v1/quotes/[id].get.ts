import { db, schema } from 'hub:db'
import { eq, and, sql } from 'drizzle-orm'

defineRouteMeta({
  openAPI: {
    summary: 'Get a single quote',
    description: 'Returns details of an approved quote by ID.',
    tags: ['Quotes'],
    security: [{ apiKey: [] }],
    parameters: [
      { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
    ],
    responses: {
      '200': { description: 'Quote details with author, reference, and tags' },
      '404': { description: 'Quote not found' },
    },
  },
})

export default defineEventHandler(async (event) => {
  const quoteId = parseInt(getRouterParam(event, 'id') || '')
  if (isNaN(quoteId)) throwServer(400, 'Invalid quote ID')

  const quote = await db
    .select({
      id: schema.quotes.id,
      name: schema.quotes.name,
      language: schema.quotes.language,
      viewsCount: schema.quotes.viewsCount,
      likesCount: schema.quotes.likesCount,
      sharesCount: schema.quotes.sharesCount,
      isFeatured: schema.quotes.isFeatured,
      sourceType: schema.quotes.sourceType,
      sourceUrl: schema.quotes.sourceUrl,
      createdAt: schema.quotes.createdAt,
      updatedAt: schema.quotes.updatedAt,
      authorId: schema.quotes.authorId,
      referenceId: schema.quotes.referenceId,
      authorName: schema.authors.name,
      authorIsFictional: schema.authors.isFictional,
      authorImageUrl: schema.authors.imageUrl,
      authorDescription: schema.authors.description,
      referenceName: schema.quoteReferences.name,
      referencePrimaryType: schema.quoteReferences.primaryType,
      referenceImageUrl: schema.quoteReferences.imageUrl,
      referenceDescription: schema.quoteReferences.description,
    })
    .from(schema.quotes)
    .leftJoin(schema.authors, eq(schema.quotes.authorId, schema.authors.id))
    .leftJoin(schema.quoteReferences, eq(schema.quotes.referenceId, schema.quoteReferences.id))
    .where(and(
      eq(schema.quotes.id, quoteId),
      eq(schema.quotes.status, 'approved'),
    ))
    .get()

  if (!quote) throwServer(404, 'Quote not found')

  const tags = await db
    .select({ name: schema.tags.name, color: schema.tags.color })
    .from(schema.tags)
    .innerJoin(schema.quoteTags, eq(schema.tags.id, schema.quoteTags.tagId))
    .where(eq(schema.quoteTags.quoteId, quoteId))
    .all()

  return {
    success: true,
    data: {
      id: quote.id,
      content: quote.name,
      language: quote.language,
      stats: {
        views: quote.viewsCount,
        likes: quote.likesCount,
        shares: quote.sharesCount,
      },
      featured: quote.isFeatured,
      source: quote.sourceType ? {
        type: quote.sourceType,
        url: quote.sourceUrl,
      } : null,
      author: quote.authorId ? {
        id: quote.authorId,
        name: quote.authorName,
        fictional: quote.authorIsFictional,
        image_url: quote.authorImageUrl,
        description: quote.authorDescription,
      } : null,
      reference: quote.referenceId ? {
        id: quote.referenceId,
        name: quote.referenceName,
        type: quote.referencePrimaryType,
        image_url: quote.referenceImageUrl,
        description: quote.referenceDescription,
      } : null,
      tags: tags.map(t => ({ name: t.name, color: t.color })),
      created_at: quote.createdAt,
      updated_at: quote.updatedAt,
    },
  }
})
