import { db, schema } from 'hub:db'
import { eq, inArray, sql } from 'drizzle-orm'
import { updateV1QuoteSchema } from '../../../validation/schemas'
import { logActivity } from '~~/server/utils/activity-log'
import { getQuoteProvenance } from '~~/server/utils/quote-provenance'
import { runApiAuditedBatch } from '~~/server/utils/api-editorial-audit'
import { hasApiPermission, requireApiKeyRole } from '~~/server/utils/api-key'
import { assertQuoteNameAvailable, buildQuoteInlineEditResolutionStatements, isQuoteNameConflictError, scopeQuoteCreationRequestKey } from '~~/server/utils/quote-creation'

defineRouteMeta({
  openAPI: {
    summary: 'Update a quote',
    description: 'Updates a quote. Users can only update their own quotes; moderators and admins can update any quote. Attribution edits require write:attributions; author/reference assignments and removals require their dedicated scopes. Inline author/reference creation requires write:authors or write:references and a moderator/admin account.',
    tags: ['Quotes'],
    security: [{ apiKey: ['write:quotes'] }],
    parameters: [
      { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
    ],
    requestBody: {
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              language: { type: 'string', enum: ['en', 'fr', 'es', 'de', 'it', 'pt', 'ru', 'ja', 'zh', 'la', 'ar', 'ko'] },
              attributions: { type: 'array', minItems: 1, description: 'Complete replacement attribution set. Exactly one item must be primary.', items: { type: 'object', required: ['is_primary'], properties: { author_id: { type: 'integer', nullable: true }, reference_id: { type: 'integer', nullable: true }, is_primary: { type: 'boolean' }, status: { type: 'string', enum: ['unverified', 'manually_verified', 'externally_verified', 'disputed'] }, notes: { type: 'string', nullable: true } } } },
              new_author: { type: 'object', properties: { name: { type: 'string' }, is_fictional: { type: 'boolean' } } },
              new_reference: { type: 'object', properties: { name: { type: 'string' }, primary_type: { type: 'string' }, original_language: { type: 'string' } } },
            },
          },
        },
      },
    },
    responses: {
      '200': { description: 'Quote updated' },
      '403': { description: 'Not authorized to update this quote' },
      '404': { description: 'Quote not found' },
      '409': { description: 'Another active quote already has this text' },
    },
  },
})

export default defineEventHandler(async (event) => {
  const api = event.context.api
  requireApiPermission(api, 'write:quotes')

  const quoteId = parseInt(getRouterParam(event, 'id') || '')
  if (isNaN(quoteId)) throwServer(400, 'Invalid quote ID')

  const body = await readValidatedBody(event, updateV1QuoteSchema.parse)

  const existingQuote = await db.select().from(schema.quotes).where(eq(schema.quotes.id, quoteId)).get()
  if (!existingQuote) throwServer(404, 'Quote not found')

  const isMod = api.userRole === 'admin' || api.userRole === 'moderator'
  if (body.language !== undefined && !isMod) {
    throwServer(403, 'Only moderators and admins can change a quote language')
  }
  const isOwner = existingQuote!.userId === api.userId
  if (!isMod && !isOwner) throwServer(403, 'You can only update your own quotes')

  const currentProvenance = await getQuoteProvenance(quoteId)
  const primaryAttribution = currentProvenance.attributions.find(item => item.is_primary) ?? currentProvenance.attributions[0]
  const replacementAttributions = body.attributions
  if (replacementAttributions) requireApiPermission(api, 'write:attributions')
  type AttributionReplacement = NonNullable<typeof replacementAttributions>[number]
  const attributionsToUpdate: Array<{ id: number; replacement: AttributionReplacement }> = []
  const attributionsToInsert: AttributionReplacement[] = []
  const remainingAttributions = new Map<string, typeof currentProvenance.attributions>()
  for (const attribution of currentProvenance.attributions) {
    const key = JSON.stringify([attribution.author_id ?? null, attribution.reference_id ?? null])
    const matches = remainingAttributions.get(key) ?? []
    matches.push(attribution)
    remainingAttributions.set(key, matches)
  }

  for (const replacement of replacementAttributions ?? []) {
    const key = JSON.stringify([replacement.author_id ?? null, replacement.reference_id ?? null])
    const match = remainingAttributions.get(key)?.shift()
    if (match) {
      attributionsToUpdate.push({ id: match.id, replacement })
    } else {
      attributionsToInsert.push(replacement)
    }
  }

  const attributionsToDelete = [...remainingAttributions.values()].flat()
  if (attributionsToDelete.length > 0) {
    requireApiPermission(api, 'delete:attributions')
  }

  for (const { id, replacement } of attributionsToUpdate) {
    const current = currentProvenance.attributions.find(item => item.id === id)
    if (current && replacement.author_id !== current.author_id) requireApiPermission(api, 'assign:authors')
    if (current && replacement.reference_id !== current.reference_id) requireApiPermission(api, 'assign:references')
  }
  for (const attribution of attributionsToInsert) {
    if (attribution.author_id != null) requireApiPermission(api, 'assign:authors')
    if (attribution.reference_id != null) requireApiPermission(api, 'assign:references')
  }

  const replacementPrimary = replacementAttributions?.find(attribution => attribution.is_primary)
  let authorId = replacementPrimary?.author_id ?? primaryAttribution?.author_id ?? null
  let referenceId = replacementPrimary?.reference_id ?? primaryAttribution?.reference_id ?? null

  for (const attribution of replacementAttributions ?? []) {
    if (attribution.author_id) {
      const author = await db.select({ id: schema.authors.id }).from(schema.authors)
        .where(eq(schema.authors.id, attribution.author_id)).get()
      if (!author) throwServer(400, 'Invalid author ID')
    }
    if (attribution.reference_id) {
      const reference = await db.select({ id: schema.quoteReferences.id }).from(schema.quoteReferences)
        .where(eq(schema.quoteReferences.id, attribution.reference_id)).get()
      if (!reference) throwServer(400, 'Invalid reference ID')
    }
  }

  if (body.new_author?.name) {
    requireApiPermission(api, 'assign:authors')
    requireApiPermission(api, 'write:authors')
    requireApiKeyRole(api, 'moderator', 'admin')
  }

  if (body.new_reference?.name) {
    requireApiPermission(api, 'assign:references')
    requireApiPermission(api, 'write:references')
    requireApiKeyRole(api, 'moderator', 'admin')
  }

  if (authorId == null && referenceId == null && !body.new_author && !body.new_reference) {
    throwServer(400, 'A quote requires an author or reference')
  }

  const updateData: Record<string, unknown> = {
    ...(body.name !== undefined ? { name: body.name } : {}),
    ...(body.language !== undefined ? { language: body.language } : {}),
    updatedAt: new Date(),
  }

  if (body.name !== undefined && body.name.trim().toLowerCase() !== existingQuote.name.trim().toLowerCase()) {
    await assertQuoteNameAvailable(quoteId, body.name)
  }
  const hasInlineEntity = Boolean(body.new_author?.name || body.new_reference?.name)
  const resolution = hasInlineEntity ? buildQuoteInlineEditResolutionStatements({
    requestKey: scopeQuoteCreationRequestKey(`quote-edit:${crypto.randomUUID()}`, api.userId),
    userId: api.userId,
    quoteId,
    authorId,
    referenceId,
    newAuthor: body.new_author ? {
      name: body.new_author.name,
      isFictional: body.new_author.is_fictional,
    } : undefined,
    newReference: body.new_reference ? {
      name: body.new_reference.name,
      originalLanguage: body.new_reference.original_language || body.language || 'en',
      primaryType: body.new_reference.primary_type || 'other',
    } : undefined,
  }) : undefined

  if (replacementAttributions) {
    const statements: any[] = [
      ...(resolution?.statements ?? []),
      db.update(schema.quotes).set(updateData as any).where(eq(schema.quotes.id, quoteId)),
    ]

    if (attributionsToDelete.length > 0) {
      statements.push(db.delete(schema.quoteAttributions)
        .where(inArray(schema.quoteAttributions.id, attributionsToDelete.map(attribution => attribution.id))))
    }

    for (const { id, replacement } of attributionsToUpdate) {
      const verified = isMod && replacement.status !== 'unverified'
      statements.push(db.update(schema.quoteAttributions).set({
        authorId: replacement.is_primary && body.new_author && resolution ? resolution.authorId : replacement.author_id,
        referenceId: replacement.is_primary && body.new_reference && resolution ? resolution.referenceId : replacement.reference_id,
        isPrimary: replacement.is_primary,
        status: isMod ? replacement.status : 'unverified',
        verifiedBy: verified ? api.userId : null,
        verifiedAt: verified ? new Date() : null,
        notes: replacement.notes,
        updatedAt: new Date(),
      }).where(eq(schema.quoteAttributions.id, id)))
    }

    for (const attribution of attributionsToInsert) {
      const verified = isMod && attribution.status !== 'unverified'
      statements.push(db.insert(schema.quoteAttributions).values({
        quoteId,
        authorId: attribution.is_primary && body.new_author && resolution ? resolution.authorId : attribution.author_id,
        referenceId: attribution.is_primary && body.new_reference && resolution ? resolution.referenceId : attribution.reference_id,
        isPrimary: attribution.is_primary,
        status: isMod ? attribution.status : 'unverified',
        notes: attribution.notes,
        verifiedBy: verified ? api.userId : null,
        verifiedAt: verified ? new Date() : null,
        createdBy: api.userId,
      }))
    }

    if (resolution) {
      statements.push(resolution.setPrimaryAttributionId(sql`(
        SELECT id FROM quote_attributions WHERE quote_id = ${quoteId} AND is_primary = true ORDER BY id LIMIT 1
      )`))
      statements.push(resolution.cleanup)
    }

    try {
      await runApiAuditedBatch(event, api, statements)
    } catch (error) {
      if (isQuoteNameConflictError(error)) throwServer(409, 'A similar quote already exists')
      throw error
    }
  } else {
    const statements: any[] = [
      ...(resolution?.statements ?? []),
      db.update(schema.quotes).set(updateData as any).where(eq(schema.quotes.id, quoteId)),
    ]
    if (authorId !== primaryAttribution?.author_id || referenceId !== primaryAttribution?.reference_id || resolution) {
      requireApiPermission(api, 'write:attributions')
      if (authorId != null || body.new_author) requireApiPermission(api, 'assign:authors')
      if (referenceId != null || body.new_reference) requireApiPermission(api, 'assign:references')
    }
    if (primaryAttribution) {
      statements.push(db.update(schema.quoteAttributions).set({
        authorId: resolution?.authorId ?? authorId ?? null,
        referenceId: resolution?.referenceId ?? referenceId ?? null,
        ...(body.new_author || body.new_reference ? { status: 'unverified' as const, verifiedBy: null, verifiedAt: null } : {}),
        updatedAt: new Date(),
      }).where(eq(schema.quoteAttributions.id, primaryAttribution.id)))
      if (resolution) statements.push(resolution.setPrimaryAttributionId(primaryAttribution.id))
    } else if (resolution) {
      statements.push(db.insert(schema.quoteAttributions).values({
        quoteId,
        authorId: resolution.authorId,
        referenceId: resolution.referenceId,
        isPrimary: true,
        status: 'unverified',
        createdBy: api.userId,
      }))
      statements.push(resolution.setPrimaryAttributionId(sql`last_insert_rowid()`))
    }
    if (resolution) statements.push(resolution.cleanup)
    try {
      await runApiAuditedBatch(event, api, statements)
    } catch (error) {
      if (isQuoteNameConflictError(error)) throwServer(409, 'A similar quote already exists')
      throw error
    }
  }

  await logActivity(event, { type: 'quote_edited', userId: api.userId, targetId: quoteId, targetType: 'quote', metadata: { status: existingQuote.status, name: body.name } })

  const updatedQuote = await db
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
      id: updatedQuote!.id,
      content: updatedQuote!.name,
      language: updatedQuote!.language,
      stats: {
        views: updatedQuote!.viewsCount,
        likes: updatedQuote!.likesCount,
        shares: updatedQuote!.sharesCount,
      },
      featured: updatedQuote!.isFeatured,
      ...(hasApiPermission(api, 'read:provenance') ? await getQuoteProvenance(quoteId) : {}),
      tags: tags.map(t => ({ name: t.name, color: t.color })),
      created_at: updatedQuote!.createdAt,
      updated_at: updatedQuote!.updatedAt,
    },
    message: 'Quote updated successfully',
  }
})
