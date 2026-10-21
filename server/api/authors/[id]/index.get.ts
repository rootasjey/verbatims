import { db, schema } from 'hub:db'
import { eq, and, isNotNull, desc, sql } from 'drizzle-orm'
import { toISOStringOrEmpty } from '../../../utils/date-normalization'
import { getContentLanguage, localizeAuthors } from '~~/server/utils/entity-translations'

export default defineEventHandler(async (event) => {
  try {
    const authorIdParam = getRouterParam(event, 'id')
    const authorId = Number.parseInt(authorIdParam || '', 10)
    if (!authorIdParam || Number.isNaN(authorId)) throwServer(400, 'Invalid author ID')

    // Fetch author
    const author = await db.select()
      .from(schema.authors)
      .where(eq(schema.authors.id, authorId))
      .get()

    if (!author) { throwServer(404, 'Author not found'); return }
    const localizedAuthor = (await localizeAuthors([author], getContentLanguage(event)))[0] ?? author

    // Count approved quotes by this author
    const quotesCountResult = await db.select({ count: sql<number>`count(*)` })
      .from(schema.quoteAttributions)
      .innerJoin(schema.quotes, eq(schema.quoteAttributions.quoteId, schema.quotes.id))
      .where(and(
        eq(schema.quoteAttributions.authorId, authorId),
        eq(schema.quotes.status, 'approved')
      ))
      .get()

    const quotesCount = quotesCountResult?.count || 0

    // Get most referenced work (origin reference)
    // First, get all references with their quote counts for this author
    const referenceCounts = await db.select({
      referenceId: schema.quoteReferences.id,
      referenceName: schema.quoteReferences.name,
      count: sql<number>`count(*)`,
      maxCreatedAt: sql<string>`max(${schema.quotes.createdAt})`
    })
      .from(schema.quoteAttributions)
      .innerJoin(schema.quotes, eq(schema.quoteAttributions.quoteId, schema.quotes.id))
      .innerJoin(schema.quoteReferences, eq(schema.quoteAttributions.referenceId, schema.quoteReferences.id))
      .where(and(
        eq(schema.quoteAttributions.authorId, authorId),
        eq(schema.quotes.status, 'approved'),
        isNotNull(schema.quoteAttributions.referenceId)
      ))
      .groupBy(schema.quoteAttributions.referenceId)
      .orderBy(desc(sql`count(*)`), desc(sql`max(${schema.quotes.createdAt})`))
      .limit(1)
      .get()

    // Parse JSON fields
    const socials = parseAuthorSocials(author.socials as string | null | undefined)

    const transformedAuthor: AuthorWithSocials = {
      id: Number(author.id),
      name: author.name,
      is_fictional: Boolean(author.isFictional),
      birth_date: author.birthDate ?? undefined,
      birth_year: author.birthYear,
      birth_era: author.birthEra ?? 'ce',
      birth_month: author.birthMonth,
      birth_day: author.birthDay,
      birth_is_approximate: Boolean(author.birthIsApproximate),
      birth_calendar: author.birthCalendar ?? 'gregorian-proleptic',
      birth_location: author.birthLocation ?? undefined,
      death_date: author.deathDate ?? undefined,
      death_year: author.deathYear,
      death_era: author.deathEra ?? 'ce',
      death_month: author.deathMonth,
      death_day: author.deathDay,
      death_is_approximate: Boolean(author.deathIsApproximate),
      death_calendar: author.deathCalendar ?? 'gregorian-proleptic',
      death_location: author.deathLocation ?? undefined,
      job: localizedAuthor.job ?? undefined,
      description: localizedAuthor.description ?? undefined,
      image_url: author.imageUrl ?? undefined,
      image_alt: author.imageAlt ?? undefined,
      image_credit: author.imageCredit ?? undefined,
      image_source_url: author.imageSourceUrl ?? undefined,
      image_license: author.imageLicense ?? undefined,
      image_date: author.imageDate ?? undefined,
      image_location: author.imageLocation ?? undefined,
      socials,
      views_count: Number(author.viewsCount ?? 0),
      likes_count: Number(author.likesCount ?? 0),
      shares_count: Number(author.sharesCount ?? 0),
      quotes_count: Number(quotesCount),
      created_at: toISOStringOrEmpty(author.createdAt),
      updated_at: toISOStringOrEmpty(author.updatedAt),
      origin_reference_id: referenceCounts?.referenceId ? Number(referenceCounts.referenceId) : undefined,
      origin_reference_name: referenceCounts?.referenceName ?? undefined
    }

    const response: ApiResponse<AuthorWithSocials> = {
      success: true,
      data: transformedAuthor
    }

    return response
  } catch (error: any) {
    if (error && error.statusCode) throw error
    console.error('Error fetching author:', error)
    throwServer(500, 'Failed to fetch author')
  }
})
