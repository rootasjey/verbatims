import { db, schema } from 'hub:db'
import { eq, and } from 'drizzle-orm'
import type { ProcessedQuoteResult } from '~~/server/types'

export default defineEventHandler(async (event) => {
  try {
    const quoteId = getRouterParam(event, 'id')
    if (!quoteId || isNaN(parseInt(quoteId))) {
      throwServer(400, 'Invalid quote ID')
    }

    const quote = await db.select({
      id: schema.quotes.id,
      name: schema.quotes.name,
      language: schema.quotes.language,
      status: schema.quotes.status,
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
      userId: schema.quotes.userId,
      authorName: schema.authors.name,
      authorIsFictional: schema.authors.isFictional,
      authorImageUrl: schema.authors.imageUrl,
      referenceName: schema.quoteReferences.name,
      referencePrimaryType: schema.quoteReferences.primaryType,
      userName: schema.users.name
    })
    .from(schema.quotes)
    .leftJoin(schema.authors, eq(schema.quotes.authorId, schema.authors.id))
    .leftJoin(schema.quoteReferences, eq(schema.quotes.referenceId, schema.quoteReferences.id))
    .leftJoin(schema.users, eq(schema.quotes.userId, schema.users.id))
    .where(and(
      eq(schema.quotes.id, parseInt(quoteId!)),
      eq(schema.quotes.status, 'approved')
    ))
    .get()

    if (!quote) {
      throwServer(404, 'Quote not found')
    }
    const q = quote!

    // Fetch tags for the quote
    const [tags, attributions, sources] = await Promise.all([
      db.select({
      name: schema.tags.name,
      color: schema.tags.color
      })
        .from(schema.tags)
        .innerJoin(schema.quoteTags, eq(schema.tags.id, schema.quoteTags.tagId))
        .where(eq(schema.quoteTags.quoteId, parseInt(quoteId!)))
        .all(),
      db.select({
        id: schema.quoteAttributions.id,
        quoteId: schema.quoteAttributions.quoteId,
        authorId: schema.quoteAttributions.authorId,
        referenceId: schema.quoteAttributions.referenceId,
        isPrimary: schema.quoteAttributions.isPrimary,
        status: schema.quoteAttributions.status,
        verifiedBy: schema.quoteAttributions.verifiedBy,
        verifiedAt: schema.quoteAttributions.verifiedAt,
        notes: schema.quoteAttributions.notes,
        authorName: schema.authors.name,
        referenceName: schema.quoteReferences.name,
      })
        .from(schema.quoteAttributions)
        .leftJoin(schema.authors, eq(schema.quoteAttributions.authorId, schema.authors.id))
        .leftJoin(schema.quoteReferences, eq(schema.quoteAttributions.referenceId, schema.quoteReferences.id))
        .where(eq(schema.quoteAttributions.quoteId, parseInt(quoteId!)))
        .all(),
      db.select({
        id: schema.quoteSources.id,
        quoteId: schema.quoteSources.quoteId,
        attributionId: schema.quoteSources.attributionId,
        sourceType: schema.quoteSources.sourceType,
        sourceUrl: schema.quoteSources.sourceUrl,
        label: schema.quoteSources.label,
        verificationStatus: schema.quoteSources.verificationStatus,
        verifiedBy: schema.quoteSources.verifiedBy,
        verifiedAt: schema.quoteSources.verifiedAt,
        notes: schema.quoteSources.notes,
        isPrimary: schema.quoteSources.isPrimary,
      })
        .from(schema.quoteSources)
        .where(eq(schema.quoteSources.quoteId, parseInt(quoteId!)))
        .all(),
    ])

    const primaryAttribution = attributions.find(attribution => attribution.isPrimary) ?? attributions[0]
    const primarySource = sources.find(source => source.isPrimary) ?? sources[0]

    const transformedQuote = {
      id: q.id,
      name: q.name,
      language: q.language,
      status: q.status,
      views_count: q.viewsCount,
      likes_count: q.likesCount,
      shares_count: q.sharesCount,
      is_featured: q.isFeatured,
      source_type: primarySource?.sourceType ?? q.sourceType,
      source_url: primarySource?.sourceUrl ?? q.sourceUrl,
      created_at: q.createdAt,
      updated_at: q.updatedAt,
      author: (primaryAttribution?.authorId ?? q.authorId) ? {
        id: primaryAttribution?.authorId ?? q.authorId!,
        name: primaryAttribution?.authorName ?? q.authorName,
        is_fictional: q.authorIsFictional,
        image_url: q.authorImageUrl
      } : undefined,
      reference: (primaryAttribution?.referenceId ?? q.referenceId) ? {
        id: primaryAttribution?.referenceId ?? q.referenceId!,
        name: primaryAttribution?.referenceName ?? q.referenceName,
        primary_type: q.referencePrimaryType
      } : undefined,
      user: {
        id: q.userId,
        name: q.userName
      },
      tags: tags.map(t => ({
        name: t.name,
        color: t.color
      })),
      attributions: attributions.map(attribution => ({
        id: attribution.id,
        quote_id: attribution.quoteId,
        author_id: attribution.authorId,
        reference_id: attribution.referenceId,
        is_primary: attribution.isPrimary,
        status: attribution.status,
        verified_by: attribution.verifiedBy,
        verified_at: attribution.verifiedAt,
        notes: attribution.notes,
        author: attribution.authorId ? { id: attribution.authorId, name: attribution.authorName } : undefined,
        reference: attribution.referenceId ? { id: attribution.referenceId, name: attribution.referenceName } : undefined,
      })),
      sources: sources.map(source => ({
        id: source.id,
        quote_id: source.quoteId,
        attribution_id: source.attributionId,
        source_type: source.sourceType,
        source_url: source.sourceUrl,
        label: source.label,
        verification_status: source.verificationStatus,
        verified_by: source.verifiedBy,
        verified_at: source.verifiedAt,
        notes: source.notes,
        is_primary: source.isPrimary,
      })),
    }

    return {
      success: true,
      data: transformedQuote as unknown as ProcessedQuoteResult
    }
  } catch (error: any) {
    if ((error as any).statusCode) throw error
    
    console.error('Error fetching quote:', error)
    throwServer(500, 'Failed to fetch quote')
  }
})
