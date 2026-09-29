import { db, schema } from 'hub:db'
import { eq, sql, and, ne } from 'drizzle-orm'
import { createQuoteSchema } from '../../validation/schemas'
import { getQuoteProvenance, syncPrimaryAttribution, syncPrimarySource } from '~~/server/utils/quote-provenance'
import { detectSubmittedQuoteLanguage } from '~~/server/utils/quote-language'

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireAuth(event)
    if (user.role === 'user') {
      await requireRateLimit(event, `create-quote:user:${user.id}`, 10, 3600, 'You have reached the limit of quote creations. Please try again later.')
    }

    const body = await readValidatedBody(event, createQuoteSchema.parse)

    const requestedPrimary = body.attributions.find(attribution => attribution.is_primary)!
    let authorId = requestedPrimary.author_id
    let referenceId = requestedPrimary.reference_id

    if (body.new_author?.name) {
      const authorResult = await db.insert(schema.authors).values({
        name: body.new_author.name,
        isFictional: body.new_author.is_fictional || false,
        job: body.new_author.job || null,
        description: body.new_author.description || null
      }).returning({ id: schema.authors.id }).get()
      
      authorId = authorResult.id
    }

    if (body.new_reference?.name) {
      const referenceResult = await db.insert(schema.quoteReferences).values({
        name: body.new_reference.name,
        originalLanguage: body.new_reference.original_language || 'en',
        primaryType: body.new_reference.primary_type || 'other',
        description: body.new_reference.description ?? null,
        releaseDate: body.new_reference.release_date ?? null,
      } as any).returning({ id: schema.quoteReferences.id }).get()
      
      referenceId = referenceResult.id
    }

    // Validate author_id if provided
    if (authorId) {
      const author = await db.select({ id: schema.authors.id })
        .from(schema.authors)
        .where(eq(schema.authors.id, authorId))
        .get()
      if (!author) {
        throwServer(400, 'Invalid author ID')
      }
    }

    // Validate reference_id if provided
    if (referenceId) {
      const reference = await db.select({ id: schema.quoteReferences.id })
        .from(schema.quoteReferences)
        .where(eq(schema.quoteReferences.id, referenceId))
        .get()
      if (!reference) {
        throwServer(400, 'Invalid reference ID')
      }
    }

    if (authorId == null && referenceId == null) {
      throwServer(400, 'A quote requires an author or reference')
    }

    // Check for duplicate quotes (fuzzy matching)
    const similarQuotes = await db.select({ id: schema.quotes.id })
      .from(schema.quotes)
      .where(and(
        sql`LOWER(TRIM(${schema.quotes.name})) = LOWER(TRIM(${body.name}))`,
        ne(schema.quotes.status, 'rejected')
      ))
      .limit(1)
      .get()

    if (similarQuotes) {
      throwServer(409, 'A similar quote already exists')
    }

    const isPrivileged = user.role === 'admin' || user.role === 'moderator'
    const language = await detectSubmittedQuoteLanguage(event, body.name)
    let quoteId: number
    try {
      const quoteResult = await db.insert(schema.quotes).values({
        name: body.name,
        language,
        userId: user.id,
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date()
      } as any).returning({ id: schema.quotes.id }).get()
      quoteId = quoteResult.id

      await syncPrimaryAttribution(
        quoteId,
        authorId || null,
        referenceId || null,
        user.id,
        isPrivileged ? requestedPrimary.status : 'unverified',
        requestedPrimary.notes,
      )
      const additionalAttributions = body.attributions.filter(attribution => !attribution.is_primary)
      if (additionalAttributions.length) {
        await db.batch(additionalAttributions.map(attribution => db.insert(schema.quoteAttributions).values({
          quoteId,
          authorId: attribution.author_id,
          referenceId: attribution.reference_id,
          isPrimary: false,
          status: isPrivileged ? attribution.status : 'unverified',
          notes: attribution.notes,
          createdBy: user.id,
        })) as any)
      }
    } catch (error) {
      if (quoteId!) {
        await db.delete(schema.quotes).where(eq(schema.quotes.id, quoteId)).run().catch(() => undefined)
      }
      throw error
    }

    // Add tags if provided
    if (body.tags && body.tags.length > 0) {
      for (const tagId of body.tags) {
        const tag = await db.select({ id: schema.tags.id })
          .from(schema.tags)
          .where(eq(schema.tags.id, Number(tagId)))
          .get()
        
        if (tag) {
          await db.insert(schema.quoteTags).values({
            quoteId,
            tagId: tagId
          } as any).run()
        }
      }
    }

    // Fetch the created quote with all related data
    const createdQuote = await db.select({
      id: schema.quotes.id,
      name: schema.quotes.name,
      language: schema.quotes.language,
      userId: schema.quotes.userId,
      status: schema.quotes.status,
      viewsCount: schema.quotes.viewsCount,
      likesCount: schema.quotes.likesCount,
      sharesCount: schema.quotes.sharesCount,
      isFeatured: schema.quotes.isFeatured,
      createdAt: schema.quotes.createdAt,
      updatedAt: schema.quotes.updatedAt,
      userName: schema.users.name,
      userEmail: schema.users.email,
      userAvatarUrl: schema.users.avatarUrl,
      userRole: schema.users.role
    })
    .from(schema.quotes)
    .leftJoin(schema.users, eq(schema.quotes.userId, schema.users.id))
    .where(eq(schema.quotes.id, quoteId))
    .get()

    if (!createdQuote) {
      throwServer(500, 'Failed to fetch created quote')
    }
    const c = createdQuote!

    // Fetch tags for the quote
    const tags = await db.select({
      id: schema.tags.id,
      name: schema.tags.name,
      color: schema.tags.color
    })
    .from(schema.tags)
    .innerJoin(schema.quoteTags, eq(schema.tags.id, schema.quoteTags.tagId))
    .where(eq(schema.quoteTags.quoteId, quoteId))
    .all()

    // Transform the result
    const transformedQuote: QuoteWithMetadata = {
      id: c.id,
      name: c.name,
      language: c.language!,
      user_id: c.userId,
      status: c.status as QuoteStatus,
      views_count: c.viewsCount ?? 0,
      likes_count: c.likesCount ?? 0,
      shares_count: c.sharesCount ?? 0,
      is_featured: c.isFeatured ?? false,
      created_at: c.createdAt?.toISOString() || new Date().toISOString(),
      updated_at: c.updatedAt?.toISOString() || new Date().toISOString(),
      user: {
        id: c.userId,
        name: c.userName || '',
        email: c.userEmail ?? undefined,
        avatar_url: c.userAvatarUrl ?? undefined
      },
      tags: tags.map(t => ({
        id: t.id,
        name: t.name,
        color: t.color || 'gray'
      })),
      ...((await getQuoteProvenance(quoteId)) as any),
    }

    return {
      success: true,
      data: transformedQuote,
      message: 'Quote saved as draft'
    }
  } catch (error: any) {
    if ((error as any).statusCode) throw error
    console.error('Error creating quote:', error)
    throwServer(500, 'Failed to create quote')
  }
})
