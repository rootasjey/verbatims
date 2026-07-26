import { db, schema } from 'hub:db'
import { eq, sql } from 'drizzle-orm'

defineRouteMeta({
  openAPI: {
    summary: 'Get a single reference',
    description: 'Returns details of a reference by ID.',
    tags: ['References'],
    security: [{ apiKey: [] }],
    parameters: [
      { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
      { name: 'include', in: 'query', schema: { type: 'string' }, description: 'Comma-separated fields to include (e.g. quotes_count)' },
    ],
    responses: {
      '200': { description: 'Reference details' },
      '404': { description: 'Reference not found' },
    },
  },
})

export default defineEventHandler(async (event) => {
  const refId = parseInt(getRouterParam(event, 'id') || '')
  if (isNaN(refId)) throwServer(400, 'Invalid reference ID')

  const query = getQuery(event)
  const include = ((query.include as string) || '').split(',').map(s => s.trim()).filter(Boolean)

  const selectFields: any = {
    id: schema.quoteReferences.id,
    name: schema.quoteReferences.name,
    primaryType: schema.quoteReferences.primaryType,
    secondaryType: schema.quoteReferences.secondaryType,
    imageUrl: schema.quoteReferences.imageUrl,
    releaseDate: schema.quoteReferences.releaseDate,
    originalLanguage: schema.quoteReferences.originalLanguage,
    description: schema.quoteReferences.description,
    urls: schema.quoteReferences.urls,
    viewsCount: schema.quoteReferences.viewsCount,
    likesCount: schema.quoteReferences.likesCount,
    sharesCount: schema.quoteReferences.sharesCount,
    createdAt: schema.quoteReferences.createdAt,
    updatedAt: schema.quoteReferences.updatedAt,
  }

  if (include.includes('quotes_count')) {
    selectFields.quotesCount = sql<number>`(SELECT COUNT(*) FROM ${schema.quotes} WHERE ${schema.quotes.referenceId} = ${schema.quoteReferences.id})`
  }

  const ref = await db
    .select(selectFields)
    .from(schema.quoteReferences)
    .where(eq(schema.quoteReferences.id, refId))
    .get()

  if (!ref) throwServer(404, 'Reference not found')

  const data: any = {
    id: ref.id,
    name: ref.name,
    type: ref.primaryType,
    secondary_type: ref.secondaryType,
    image_url: ref.imageUrl,
    release_date: ref.releaseDate,
    language: ref.originalLanguage,
    description: ref.description,
    urls: ref.urls ? JSON.parse(ref.urls) : [],
    stats: { views: ref.viewsCount, likes: ref.likesCount, shares: ref.sharesCount },
    created_at: ref.createdAt,
    updated_at: ref.updatedAt,
  }

  if (include.includes('quotes_count')) {
    data.quotes_count = ref.quotesCount
  }

  return { success: true, data }
})
