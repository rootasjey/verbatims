import { db, schema } from 'hub:db'
import { eq, and, sql } from 'drizzle-orm'
import { getQuoteProvenance } from '~~/server/utils/quote-provenance'

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
       '200': { description: 'Quote details with provenance and tags' },
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
      createdAt: schema.quotes.createdAt,
      updatedAt: schema.quotes.updatedAt,
    })
    .from(schema.quotes)
    .where(and(
      eq(schema.quotes.id, quoteId),
      eq(schema.quotes.status, 'approved'),
    ))
    .get()

  if (!quote) throwServer(404, 'Quote not found')

  const provenance = await getQuoteProvenance(quoteId)

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
       attributions: provenance.attributions,
       sources: provenance.sources,
      tags: tags.map(t => ({ name: t.name, color: t.color })),
      created_at: quote.createdAt,
      updated_at: quote.updatedAt,
    },
  }
})
