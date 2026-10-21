import { db, schema } from 'hub:db'
import { eq, and, sql } from 'drizzle-orm'
import { getContentLanguage, localizeReferences } from '~~/server/utils/entity-translations'

export default defineEventHandler(async (event) => {
  try {
    const referenceIdParam = getRouterParam(event, 'id')
    const referenceId = Number.parseInt(referenceIdParam || '', 10)
    if (!referenceIdParam || Number.isNaN(referenceId)) throwServer(400, 'Invalid reference ID')

    // Fetch reference
    const reference = await db.select()
      .from(schema.quoteReferences)
      .where(eq(schema.quoteReferences.id, referenceId))
      .get()

    if (!reference) { throwServer(404, 'Reference not found'); return }
    const localizedReference = (await localizeReferences([reference], getContentLanguage(event)))[0] ?? reference

    // Count approved quotes for this reference
    const quotesCountResult = await db.select({ count: sql<number>`count(*)` })
      .from(schema.quoteAttributions)
      .innerJoin(schema.quotes, eq(schema.quoteAttributions.quoteId, schema.quotes.id))
      .where(and(
        eq(schema.quoteAttributions.referenceId, referenceId),
        eq(schema.quotes.status, 'approved')
      ))
      .get()

    const quotesCount = quotesCountResult?.count || 0

    const transformedReference = {
      ...reference,
      name: localizedReference.name,
      description: localizedReference.description,
      primary_type: reference.primaryType,
      secondary_type: reference.secondaryType,
      release_date: reference.releaseDate,
      original_language: reference.originalLanguage,
      image_url: reference.imageUrl,
      image_alt: reference.imageAlt,
      image_credit: reference.imageCredit,
      image_source_url: reference.imageSourceUrl,
      image_license: reference.imageLicense,
      image_date: reference.imageDate,
      image_location: reference.imageLocation,
      views_count: reference.viewsCount,
      likes_count: reference.likesCount,
      shares_count: reference.sharesCount,
      created_at: reference.createdAt,
      updated_at: reference.updatedAt,
      urls: reference.urls ? JSON.parse(reference.urls as string) : [],
      quotes_count: quotesCount
    }

    return {
      success: true,
      data: transformedReference
    }
  } catch (error: any) {
    console.error('Error fetching reference:', error)
    if ((error as any).statusCode) throw error
    throwServer(500, 'Failed to fetch reference')
  }
})
