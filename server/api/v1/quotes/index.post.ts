import { db, schema } from 'hub:db'
import { eq, sql, and, ne, inArray } from 'drizzle-orm'
import { createV1QuoteSchema } from '../../../validation/schemas'
import { getQuoteProvenance } from '~~/server/utils/quote-provenance'
import { detectSubmittedQuoteLanguage } from '~~/server/utils/quote-language'
import { hasApiPermission, requireApiKeyRole, requireApiPermission } from '~~/server/utils/api-key'
import { getAuditedBatchRow, runApiAuditedBatch } from '~~/server/utils/api-editorial-audit'
import { buildQuoteCreationStatements, findQuoteCreationRequest, hashQuoteCreationPayload, normalizeQuoteCreationRequestKey, scopeQuoteCreationRequestKey } from '~~/server/utils/quote-creation'

defineRouteMeta({
  openAPI: {
    summary: 'Create a quote',
    description: 'Creates a new quote in draft status. The quote will be associated with the API key owner and requires moderation before being publicly visible. Optional sources require write:sources. Inline author/reference creation requires write:authors or write:references and a moderator/admin account.',
    parameters: [{ in: 'header', name: 'Idempotency-Key', required: false, schema: { type: 'string' }, description: 'Stable key to safely retry the same payload after a lost response. Reuse with a different payload returns 409. Maximum 128 characters.' }],
    tags: ['Quotes'],
    security: [{ apiKey: ['write:quotes', 'write:attributions', 'assign:authors', 'assign:references'] }],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['name'],
            properties: {
              name: { type: 'string', description: 'Quote content' },
              language: { type: 'string', enum: ['en', 'fr', 'es', 'de', 'it', 'pt', 'ru', 'ja', 'zh', 'la', 'ar', 'ko'], description: 'Optional language override; automatically detected when omitted' },
              attributions: {
                type: 'array',
                minItems: 1,
                description: 'Complete attribution set. Exactly one item must be primary.',
                items: { type: 'object', required: ['is_primary'], properties: { author_id: { type: 'integer', nullable: true }, reference_id: { type: 'integer', nullable: true }, is_primary: { type: 'boolean' }, status: { type: 'string', enum: ['unverified', 'manually_verified', 'externally_verified', 'disputed'] }, notes: { type: 'string', nullable: true } } },
              },
              new_author: {
                type: 'object',
                properties: { name: { type: 'string' }, is_fictional: { type: 'boolean', default: false }, job: { type: 'string', nullable: true }, description: { type: 'string', nullable: true } },
                description: 'Create a new author inline',
              },
              new_reference: {
                type: 'object',
                properties: { name: { type: 'string' }, primary_type: { type: 'string', default: 'other' }, original_language: { type: 'string', default: 'en' }, description: { type: 'string', nullable: true }, release_date: { type: 'string', nullable: true } },
                description: 'Create a new reference inline',
              },
              sources: {
                type: 'array',
                maxItems: 10,
                description: 'Optional source records. The server links them to the primary attribution and stores them as unverified.',
                items: { type: 'object', properties: {
                  source_type: { type: 'string', default: 'manual', description: 'Legacy source-origin label, preserved as supplied.' },
                  source_medium: { type: 'string', enum: ['book', 'web_page', 'transcript', 'audio', 'audiovisual', 'document', 'other'] },
                  source_url: { type: 'string', format: 'uri', nullable: true },
                  label: { type: 'string', nullable: true },
                  translator_name: { type: 'string', nullable: true },
                  locator_type: { type: 'string', enum: ['page', 'chapter', 'timecode'], nullable: true },
                  locator_value: { type: 'string', nullable: true, description: 'Timecodes accept MM:SS or HH:MM:SS and are stored as HH:MM:SS.' },
                  notes: { type: 'string', nullable: true },
                } },
              },
              tags: { type: 'array', items: { type: 'number' }, maxItems: 20, description: 'Tag IDs to associate' },
            },
          },
        },
      },
    },
    responses: {
      '201': { description: 'Quote created' },
      '400': { description: 'Validation error or invalid author/reference ID' },
      '409': { description: 'Similar quote already exists' },
    },
  },
})

export default defineEventHandler(async (event) => {
  const api = event.context.api
  requireApiPermission(api, 'write:quotes')

  const body = await readValidatedBody(event, createV1QuoteSchema.parse)
  if (body.sources?.length) requireApiPermission(api, 'write:sources')

  const requestedAttributions = body.attributions
  requireApiPermission(api, 'write:attributions')
  for (const attribution of requestedAttributions) {
    if (attribution.author_id != null) requireApiPermission(api, 'assign:authors')
    if (attribution.reference_id != null) requireApiPermission(api, 'assign:references')
  }
  if (body.new_author) {
    requireApiPermission(api, 'assign:authors')
    requireApiPermission(api, 'write:authors')
    requireApiKeyRole(api, 'moderator', 'admin')
  }
  if (body.new_reference) {
    requireApiPermission(api, 'assign:references')
    requireApiPermission(api, 'write:references')
    requireApiKeyRole(api, 'moderator', 'admin')
  }
  const requestedPrimary = requestedAttributions.find(attribution => attribution.is_primary)!
  const requestKey = normalizeQuoteCreationRequestKey(getHeader(event, 'idempotency-key'))
  const payloadHash = await hashQuoteCreationPayload(body)
  const priorRequest = await findQuoteCreationRequest(requestKey, api.userId, payloadHash)
  let quoteId = priorRequest?.quoteId ?? undefined

  if (!priorRequest) {
    for (const attribution of requestedAttributions) {
      if (attribution.author_id != null) {
        const author = await db.select({ id: schema.authors.id }).from(schema.authors)
          .where(eq(schema.authors.id, attribution.author_id)).get()
        if (!author && !(attribution.is_primary && body.new_author)) throwServer(400, 'Invalid author ID')
      }
      if (attribution.reference_id != null) {
        const reference = await db.select({ id: schema.quoteReferences.id }).from(schema.quoteReferences)
          .where(eq(schema.quoteReferences.id, attribution.reference_id)).get()
        if (!reference && !(attribution.is_primary && body.new_reference)) throwServer(400, 'Invalid reference ID')
      }
    }

    if (requestedPrimary.author_id == null && requestedPrimary.reference_id == null && !body.new_author && !body.new_reference) {
      throwServer(400, 'A quote requires an author or reference')
    }

    const similarQuotes = await db.select({ id: schema.quotes.id })
      .from(schema.quotes)
      .where(and(
        sql`LOWER(TRIM(${schema.quotes.name})) = LOWER(TRIM(${body.name}))`,
        ne(schema.quotes.status, 'rejected')
      ))
      .limit(1)
      .get()
    if (similarQuotes) throwServer(409, 'A similar quote already exists')

    const language = body.language ?? await detectSubmittedQuoteLanguage(event, body.name)
    const isPrivileged = api.userRole === 'admin' || api.userRole === 'moderator'
    const requestedTagIds = [...new Set((body.tags ?? []).map(Number).filter(Number.isInteger))]
    const validTags = requestedTagIds.length
      ? await db.select({ id: schema.tags.id }).from(schema.tags).where(inArray(schema.tags.id, requestedTagIds)).all()
      : []
    const { statements, quoteIdResultIndex } = buildQuoteCreationStatements({
      requestKey: scopeQuoteCreationRequestKey(requestKey, api.userId),
      userId: api.userId,
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
        verifiedBy: isPrivileged && requestedPrimary.status !== 'unverified' ? api.userId : null,
      },
      additionalAttributions: requestedAttributions.filter(attribution => !attribution.is_primary).map(attribution => ({
        authorId: attribution.author_id,
        referenceId: attribution.reference_id,
        status: isPrivileged ? attribution.status : 'unverified',
        notes: attribution.notes,
      })),
      sources: body.sources,
      tagIds: validTags.map(tag => tag.id),
      activitySource: event.context?.source ?? 'web',
    })

    try {
      const results = await runApiAuditedBatch(event, api, statements)
      quoteId = getAuditedBatchRow<{ quoteId: number }>(results, quoteIdResultIndex + 1).quoteId
    } catch (error) {
      let committedRequest: Awaited<ReturnType<typeof findQuoteCreationRequest>>
      try {
        committedRequest = await findQuoteCreationRequest(requestKey, api.userId, payloadHash)
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

  if (priorRequest && !priorRequest.quoteId) throwServer(409, 'This Idempotency-Key was already used')
  if (!quoteId) throwServer(500, 'Quote creation did not return an ID')

  const createdQuote = await db
    .select({
      id: schema.quotes.id,
      name: schema.quotes.name,
      language: schema.quotes.language,
      viewsCount: schema.quotes.viewsCount,
      likesCount: schema.quotes.likesCount,
      sharesCount: schema.quotes.sharesCount,
      isFeatured: schema.quotes.isFeatured,
      createdAt: schema.quotes.createdAt,
      updatedAt: schema.quotes.updatedAt,
    })
    .from(schema.quotes)
    .where(eq(schema.quotes.id, quoteId))
    .get()

  const tags = await db
    .select({ name: schema.tags.name, color: schema.tags.color })
    .from(schema.tags)
    .innerJoin(schema.quoteTags, eq(schema.tags.id, schema.quoteTags.tagId))
    .where(eq(schema.quoteTags.quoteId, quoteId))
    .all()

  return {
    success: true,
    data: {
      id: createdQuote!.id,
      content: createdQuote!.name,
      language: createdQuote!.language,
      stats: {
        views: createdQuote!.viewsCount,
        likes: createdQuote!.likesCount,
        shares: createdQuote!.sharesCount,
      },
      featured: createdQuote!.isFeatured,
      ...(hasApiPermission(api, 'read:provenance') ? await getQuoteProvenance(quoteId) : {}),
      tags: tags.map(t => ({ name: t.name, color: t.color })),
      created_at: createdQuote!.createdAt,
      updated_at: createdQuote!.updatedAt,
    },
    message: 'Quote created as draft',
  }
})
