import { db, schema } from 'hub:db'
import { eq, sql, and, ne, inArray } from 'drizzle-orm'
import { createQuoteSchema } from '../../validation/schemas'
import { getQuoteProvenance, syncPrimarySource } from '~~/server/utils/quote-provenance'
import { detectSubmittedQuoteLanguage } from '~~/server/utils/quote-language'
import { getAuditedBatchRow, runWebEditorialAuditedBatch } from '~~/server/utils/api-editorial-audit'
import { buildQuoteCreationStatements, findQuoteCreationRequest, hashQuoteCreationPayload, normalizeQuoteCreationRequestKey, scopeQuoteCreationRequestKey } from '~~/server/utils/quote-creation'

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireAuth(event)
    const body = await readValidatedBody(event, createQuoteSchema.parse)
    const requestedPrimary = body.attributions.find(attribution => attribution.is_primary)!
    const requestKey = normalizeQuoteCreationRequestKey(getHeader(event, 'idempotency-key'))
    const payloadHash = await hashQuoteCreationPayload(body)
    const priorRequest = await findQuoteCreationRequest(requestKey, user.id, payloadHash)
    let quoteId = priorRequest?.quoteId ?? undefined

    if (!priorRequest && user.role === 'user') {
      await requireRateLimit(event, `create-quote:user:${user.id}`, 10, 3600, 'You have reached the limit of quote creations. Please try again later.')
    }

    if (!priorRequest) {
      for (const attribution of body.attributions) {
        if (attribution.author_id != null) {
          const author = await db.select({ id: schema.authors.id })
            .from(schema.authors)
            .where(eq(schema.authors.id, attribution.author_id))
            .get()
          if (!author && !(attribution.is_primary && body.new_author)) {
            throwServer(400, 'Invalid author ID')
          }
        }

        if (attribution.reference_id != null) {
          const reference = await db.select({ id: schema.quoteReferences.id })
            .from(schema.quoteReferences)
            .where(eq(schema.quoteReferences.id, attribution.reference_id))
            .get()
          if (!reference && !(attribution.is_primary && body.new_reference)) {
            throwServer(400, 'Invalid reference ID')
          }
        }
      }
    }

    if (!priorRequest && requestedPrimary.author_id == null && requestedPrimary.reference_id == null && !body.new_author && !body.new_reference) {
      throwServer(400, 'A quote requires an author or reference')
    }

    if (priorRequest && !priorRequest.quoteId) throwServer(409, 'This Idempotency-Key was already used')

    if (!priorRequest) {
      const similarQuotes = await db.select({ id: schema.quotes.id })
        .from(schema.quotes)
        .where(and(
          sql`LOWER(TRIM(${schema.quotes.name})) = LOWER(TRIM(${body.name}))`,
          ne(schema.quotes.status, 'rejected')
        ))
        .limit(1)
        .get()
      if (similarQuotes) throwServer(409, 'A similar quote already exists')

      const isPrivileged = user.role === 'admin' || user.role === 'moderator'
      const language = await detectSubmittedQuoteLanguage(event, body.name)
      const requestedTagIds = [...new Set((body.tags ?? []).map(Number).filter(Number.isInteger))]
      const validTags = requestedTagIds.length
        ? await db.select({ id: schema.tags.id }).from(schema.tags).where(inArray(schema.tags.id, requestedTagIds)).all()
        : []
      const { statements, quoteIdResultIndex } = buildQuoteCreationStatements({
        requestKey: scopeQuoteCreationRequestKey(requestKey, user.id),
        userId: user.id,
        payloadHash,
        quote: { name: body.name, language },
        authorId: requestedPrimary.author_id,
        referenceId: requestedPrimary.reference_id,
        newAuthor: body.new_author ? {
          name: body.new_author.name,
          isFictional: body.new_author.is_fictional,
          job: body.new_author.job,
          description: body.new_author.description,
        } : undefined,
        newReference: body.new_reference ? {
          name: body.new_reference.name,
          originalLanguage: body.new_reference.original_language,
          primaryType: body.new_reference.primary_type,
          description: body.new_reference.description,
          releaseDate: body.new_reference.release_date,
        } : undefined,
        primaryAttribution: {
          status: isPrivileged ? requestedPrimary.status : 'unverified',
          notes: requestedPrimary.notes,
          verifiedBy: isPrivileged && requestedPrimary.status !== 'unverified' ? user.id : null,
        },
        additionalAttributions: body.attributions.filter(attribution => !attribution.is_primary).map(attribution => ({
          authorId: attribution.author_id,
          referenceId: attribution.reference_id,
          status: isPrivileged ? attribution.status : 'unverified',
          notes: attribution.notes,
        })),
        sources: body.sources,
        tagIds: validTags.map(tag => tag.id),
      })

      try {
        const results = await runWebEditorialAuditedBatch(event, user.id, statements, 'web_user')
        quoteId = getAuditedBatchRow<{ quoteId: number }>(results, quoteIdResultIndex + 1).quoteId
      } catch (error) {
        // A response can be lost after D1 commits. Resolve a repeated request
        // key from the committed idempotency row instead of creating again.
        let committedRequest: Awaited<ReturnType<typeof findQuoteCreationRequest>>
        try {
          committedRequest = await findQuoteCreationRequest(requestKey, user.id, payloadHash)
        } catch (lookupError: any) {
          if (lookupError?.statusCode === 409) throw lookupError
        }
        if (!committedRequest?.quoteId) {
          const similarQuote = await db.select({ id: schema.quotes.id })
            .from(schema.quotes)
            .where(and(
              sql`LOWER(TRIM(${schema.quotes.name})) = LOWER(TRIM(${body.name}))`,
              ne(schema.quotes.status, 'rejected')
            ))
            .limit(1)
            .get()
          if (similarQuote) throwServer(409, 'A similar quote already exists')
          throw error
        }
        quoteId = committedRequest.quoteId
      }
    }

    if (!quoteId) throwServer(500, 'Quote creation did not return an ID')

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
