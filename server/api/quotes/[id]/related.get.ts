import { db, schema } from 'hub:db'
import { and, desc, eq, inArray, ne, notInArray, sql } from 'drizzle-orm'
import { getPrimaryQuoteProvenance, getQuoteProvenance } from '~~/server/utils/quote-provenance'

const quoteFields = {
  id: schema.quotes.id,
  name: schema.quotes.name,
  language: schema.quotes.language,
  status: schema.quotes.status,
  viewsCount: schema.quotes.viewsCount,
  likesCount: schema.quotes.likesCount,
  sharesCount: schema.quotes.sharesCount,
  isFeatured: schema.quotes.isFeatured,
  createdAt: schema.quotes.createdAt,
  updatedAt: schema.quotes.updatedAt,
  userName: schema.users.name,
}

export default defineEventHandler(async (event) => {
  try {
    const quoteId = getRouterParam(event, 'id')
    if (!quoteId || isNaN(parseInt(quoteId))) throwServer(400, 'Invalid quote ID')

    const quoteIdNum = parseInt(quoteId)
    const currentQuote = await db.select({ id: schema.quotes.id })
      .from(schema.quotes)
      .where(and(eq(schema.quotes.id, quoteIdNum), eq(schema.quotes.status, 'approved')))
      .get()

    if (!currentQuote) return { success: true, data: [] }

    const currentProvenance = await getQuoteProvenance(quoteIdNum)
    const currentAttribution = currentProvenance.attributions.find(attribution => attribution.is_primary)
      ?? currentProvenance.attributions[0]
    let relatedQuotes: any[] = []

    if (currentAttribution?.author_id) {
      relatedQuotes = await db.select(quoteFields)
        .from(schema.quotes)
        .leftJoin(schema.users, eq(schema.quotes.userId, schema.users.id))
        .where(and(
          ne(schema.quotes.id, quoteIdNum),
          eq(schema.quotes.status, 'approved'),
          sql`EXISTS (
            SELECT 1 FROM ${schema.quoteAttributions}
            WHERE ${schema.quoteAttributions.quoteId} = ${schema.quotes.id}
              AND ${schema.quoteAttributions.authorId} = ${currentAttribution.author_id}
          )`,
        ))
        .orderBy(desc(schema.quotes.likesCount), desc(schema.quotes.viewsCount))
        .limit(3)
        .all()
    }

    if (relatedQuotes.length < 4 && currentAttribution?.reference_id) {
      const referenceQuotes = await db.select(quoteFields)
        .from(schema.quotes)
        .leftJoin(schema.users, eq(schema.quotes.userId, schema.users.id))
        .where(and(
          ne(schema.quotes.id, quoteIdNum),
          eq(schema.quotes.status, 'approved'),
          ...(relatedQuotes.length ? [notInArray(schema.quotes.id, relatedQuotes.map(quote => quote.id))] : []),
          sql`EXISTS (
            SELECT 1 FROM ${schema.quoteAttributions}
            WHERE ${schema.quoteAttributions.quoteId} = ${schema.quotes.id}
              AND ${schema.quoteAttributions.referenceId} = ${currentAttribution.reference_id}
          )`,
        ))
        .orderBy(desc(schema.quotes.likesCount), desc(schema.quotes.viewsCount))
        .limit(4 - relatedQuotes.length)
        .all()

      relatedQuotes.push(...referenceQuotes)
    }

    if (relatedQuotes.length < 4) {
      const tagIds = (await db.select({ tagId: schema.quoteTags.tagId })
        .from(schema.quoteTags)
        .where(eq(schema.quoteTags.quoteId, quoteIdNum))
        .all())
        .map(tag => tag.tagId)
        .filter((id): id is number => id !== null)

      if (tagIds.length) {
        const tagQuotes = await db.selectDistinct(quoteFields)
          .from(schema.quotes)
          .innerJoin(schema.quoteTags, eq(schema.quoteTags.quoteId, schema.quotes.id))
          .leftJoin(schema.users, eq(schema.quotes.userId, schema.users.id))
          .where(and(
            inArray(schema.quoteTags.tagId, tagIds),
            ne(schema.quotes.id, quoteIdNum),
            eq(schema.quotes.status, 'approved'),
            ...(relatedQuotes.length ? [notInArray(schema.quotes.id, relatedQuotes.map(quote => quote.id))] : []),
          ))
          .orderBy(desc(schema.quotes.likesCount), desc(schema.quotes.viewsCount))
          .limit(4 - relatedQuotes.length)
          .all()

        relatedQuotes.push(...tagQuotes)
      }
    }

    const selectedQuotes = relatedQuotes.slice(0, 4)
    const quoteIds = selectedQuotes.map(quote => quote.id)
    const [allTags, provenance] = await Promise.all([
      quoteIds.length
        ? db.select({ quoteId: schema.quoteTags.quoteId, name: schema.tags.name, color: schema.tags.color })
          .from(schema.quoteTags)
          .innerJoin(schema.tags, eq(schema.quoteTags.tagId, schema.tags.id))
          .where(inArray(schema.quoteTags.quoteId, quoteIds))
          .all()
        : [],
      getPrimaryQuoteProvenance(quoteIds),
    ])

    const tagsByQuoteId: Record<number, Array<{ name: string, color: string | null }>> = {}
    for (const tag of allTags) {
      if (tag.quoteId === null) continue
      ;(tagsByQuoteId[tag.quoteId] ??= []).push({ name: tag.name, color: tag.color })
    }

    return {
      success: true,
      data: selectedQuotes.map((quote) => {
        const quoteProvenance = provenance.get(quote.id)
        const attribution = quoteProvenance?.attributions.find(item => item.is_primary)
          ?? quoteProvenance?.attributions[0]

        return {
          id: quote.id,
          name: quote.name,
          language: quote.language,
          status: quote.status,
          views_count: quote.viewsCount,
          likes_count: quote.likesCount,
          shares_count: quote.sharesCount,
          is_featured: quote.isFeatured,
          created_at: quote.createdAt,
          updated_at: quote.updatedAt,
          author: attribution?.author_id ? {
            id: attribution.author_id,
            name: attribution.author?.name,
            is_fictional: attribution.author?.is_fictional,
          } : null,
          reference: attribution?.reference_id ? {
            id: attribution.reference_id,
            name: attribution.reference?.name,
            type: attribution.reference?.primary_type,
          } : null,
          user: { name: quote.userName },
          tags: tagsByQuoteId[quote.id] ?? [],
          attributions: quoteProvenance?.attributions ?? [],
          sources: quoteProvenance?.sources ?? [],
        }
      }),
    }
  } catch (error) {
    console.error('Error fetching related quotes:', error)
    return { success: true, data: [] }
  }
})
