import { db, schema } from 'hub:db'
import { eq, sql } from 'drizzle-orm'
import { getPrimaryQuoteProvenance } from '~~/server/utils/quote-provenance'

defineRouteMeta({
  openAPI: {
    summary: 'Get random quotes',
    description: 'Returns random approved quotes. Useful for discovery features.',
    tags: ['Quotes'],
    security: [{ apiKey: [] }],
    parameters: [
      { name: 'limit', in: 'query', schema: { type: 'integer', default: 1, maximum: 10 } },
    ],
    responses: {
      '200': { description: 'Array of random quotes' },
    },
  },
})

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const limit = Math.min(parseInt(query.limit as string) || 1, 10)

  const quotes = await db
    .select({
      id: schema.quotes.id,
      name: schema.quotes.name,
      language: schema.quotes.language,
      createdAt: schema.quotes.createdAt,
    })
    .from(schema.quotes)
    .where(eq(schema.quotes.status, 'approved'))
    .orderBy(sql`RANDOM()`)
    .limit(limit)
    .all()

  const provenance = await getPrimaryQuoteProvenance(quotes.map(quote => quote.id))

  return {
    success: true,
    data: quotes.map((quote) => {
      const quoteProvenance = provenance.get(quote.id)
      const attribution = quoteProvenance?.attributions.find(item => item.is_primary)
        ?? quoteProvenance?.attributions[0]
      return {
        id: quote.id,
        content: quote.name,
        language: quote.language,
        author: attribution?.author_id ? {
          id: attribution.author_id,
          name: attribution.author?.name,
          fictional: attribution.author?.is_fictional,
        } : null,
        reference: attribution?.reference_id ? {
          id: attribution.reference_id,
          name: attribution.reference?.name,
          type: attribution.reference?.primary_type,
        } : null,
        attributions: quoteProvenance?.attributions ?? [],
        sources: quoteProvenance?.sources ?? [],
        created_at: quote.createdAt,
      }
    }),
  }
})
