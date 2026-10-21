import { db, schema } from 'hub:db'
import { eq, count, and } from 'drizzle-orm'
import { getContentLanguage, localizeAuthors } from '~~/server/utils/entity-translations'

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

  const author = await db
    .select({
      id: schema.authors.id,
      name: schema.authors.name,
      isFictional: schema.authors.isFictional,
      imageUrl: schema.authors.imageUrl,
      job: schema.authors.job,
      birthDate: schema.authors.birthDate,
      birthYear: schema.authors.birthYear,
      birthEra: schema.authors.birthEra,
      birthMonth: schema.authors.birthMonth,
      birthDay: schema.authors.birthDay,
      birthIsApproximate: schema.authors.birthIsApproximate,
      birthCalendar: schema.authors.birthCalendar,
      deathDate: schema.authors.deathDate,
      deathYear: schema.authors.deathYear,
      deathEra: schema.authors.deathEra,
      deathMonth: schema.authors.deathMonth,
      deathDay: schema.authors.deathDay,
      deathIsApproximate: schema.authors.deathIsApproximate,
      deathCalendar: schema.authors.deathCalendar,
      birthLocation: schema.authors.birthLocation,
      deathLocation: schema.authors.deathLocation,
      description: schema.authors.description,
      viewsCount: schema.authors.viewsCount,
      likesCount: schema.authors.likesCount,
      sharesCount: schema.authors.sharesCount,
      createdAt: schema.authors.createdAt,
      updatedAt: schema.authors.updatedAt,
    })
    .from(schema.authors)
    .where(eq(schema.authors.id, authorId))
    .get()

  if (!author) throwServer(404, 'Author not found')
  const localizedAuthor = (await localizeAuthors([author], getContentLanguage(event)))[0] ?? author

  let quotesCount = 0
  if (include.includes('quotes_count')) {
    const result = await db
      .select({ count: count() })
      .from(schema.quoteAttributions)
      .innerJoin(schema.quotes, eq(schema.quoteAttributions.quoteId, schema.quotes.id))
      .where(and(
        eq(schema.quoteAttributions.authorId, authorId),
        eq(schema.quotes.status, 'approved'),
      ))
      .get()
    quotesCount = result?.count || 0
  }

  return {
    success: true,
    data: {
      id: author.id,
      name: author.name,
      fictional: author.isFictional,
      image_url: author.imageUrl,
      job: localizedAuthor.job,
      dates: {
        birth: author.birthDate,
        death: author.deathDate,
        birth_year: author.birthYear,
        birth_era: author.birthEra,
        birth_month: author.birthMonth,
        birth_day: author.birthDay,
        birth_is_approximate: author.birthIsApproximate,
        birth_calendar: author.birthCalendar,
        death_year: author.deathYear,
        death_era: author.deathEra,
        death_month: author.deathMonth,
        death_day: author.deathDay,
        death_is_approximate: author.deathIsApproximate,
        death_calendar: author.deathCalendar,
        birth_location: author.birthLocation,
        death_location: author.deathLocation,
      },
      description: localizedAuthor.description,
      stats: { views: author.viewsCount, likes: author.likesCount, shares: author.sharesCount },
      created_at: author.createdAt,
      updated_at: author.updatedAt,
      ...(include.includes('quotes_count') && { quotes_count: quotesCount }),
    },
  }
})
