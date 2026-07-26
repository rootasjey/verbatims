import { db, schema } from 'hub:db'
import { eq, sql } from 'drizzle-orm'

defineRouteMeta({
  openAPI: {
    summary: 'Get a single author',
    description: 'Returns details of an author by ID.',
    tags: ['Authors'],
    security: [{ apiKey: [] }],
    parameters: [
      { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
      { name: 'include', in: 'query', schema: { type: 'string' }, description: 'Comma-separated fields to include (e.g. quotes_count)' },
    ],
    responses: {
      '200': { description: 'Author details' },
      '404': { description: 'Author not found' },
    },
  },
})

export default defineEventHandler(async (event) => {
  const authorId = parseInt(getRouterParam(event, 'id') || '')
  if (isNaN(authorId)) throwServer(400, 'Invalid author ID')

  const query = getQuery(event)
  const include = ((query.include as string) || '').split(',').map(s => s.trim()).filter(Boolean)

  const selectFields: any = {
    id: schema.authors.id,
    name: schema.authors.name,
    isFictional: schema.authors.isFictional,
    imageUrl: schema.authors.imageUrl,
    job: schema.authors.job,
    birthDate: schema.authors.birthDate,
    deathDate: schema.authors.deathDate,
    birthLocation: schema.authors.birthLocation,
    deathLocation: schema.authors.deathLocation,
    description: schema.authors.description,
    viewsCount: schema.authors.viewsCount,
    likesCount: schema.authors.likesCount,
    sharesCount: schema.authors.sharesCount,
    createdAt: schema.authors.createdAt,
    updatedAt: schema.authors.updatedAt,
  }

  if (include.includes('quotes_count')) {
    selectFields.quotesCount = sql<number>`(SELECT COUNT(*) FROM ${schema.quotes} WHERE ${schema.quotes.authorId} = ${schema.authors.id})`
  }

  const author = await db
    .select(selectFields)
    .from(schema.authors)
    .where(eq(schema.authors.id, authorId))
    .get()

  if (!author) throwServer(404, 'Author not found')

  const data: any = {
    id: author.id,
    name: author.name,
    fictional: author.isFictional,
    image_url: author.imageUrl,
    job: author.job,
    dates: {
      birth: author.birthDate,
      death: author.deathDate,
      birth_location: author.birthLocation,
      death_location: author.deathLocation,
    },
    description: author.description,
    stats: { views: author.viewsCount, likes: author.likesCount, shares: author.sharesCount },
    created_at: author.createdAt,
    updated_at: author.updatedAt,
  }

  if (include.includes('quotes_count')) {
    data.quotes_count = author.quotesCount
  }

  return { success: true, data }
})
