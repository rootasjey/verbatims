import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'
import { updateV1QuoteSchema } from '../../../validation/schemas'
import { logActivity } from '~~/server/utils/activity-log'
import { syncPrimaryAttribution, getQuoteProvenance } from '~~/server/utils/quote-provenance'

defineRouteMeta({
  openAPI: {
    summary: 'Update a quote',
    description: 'Updates a quote. Users can only update their own quotes; moderators and admins can update any quote.',
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
    const newAuthor = await db.insert(schema.authors).values({
      name: body.new_author.name,
      isFictional: body.new_author.is_fictional,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning({ id: schema.authors.id }).get()
    authorId = newAuthor.id
  }

  if (body.new_reference?.name) {
    const newReference = await db.insert(schema.quoteReferences).values({
      name: body.new_reference.name,
      originalLanguage: body.new_reference.original_language || body.language || 'en',
      primaryType: body.new_reference.primary_type || 'other',
      createdAt: new Date(),
      updatedAt: new Date()
    } as any).returning({ id: schema.quoteReferences.id }).get()
    referenceId = newReference.id
  }

  if (authorId == null && referenceId == null) {
    throwServer(400, 'A quote requires an author or reference')
  }

  const updateData: Record<string, unknown> = {
    ...(body.name !== undefined ? { name: body.name } : {}),
    ...(body.language !== undefined ? { language: body.language } : {}),
    updatedAt: new Date(),
  }

  if (replacementAttributions) {
    await db.batch([
      db.update(schema.quotes).set(updateData as any).where(eq(schema.quotes.id, quoteId)),
      db.delete(schema.quoteAttributions).where(eq(schema.quoteAttributions.quoteId, quoteId)),
      db.insert(schema.quoteAttributions).values(replacementAttributions.map(attribution => ({
        quoteId,
        authorId: attribution.author_id,
        referenceId: attribution.reference_id,
        isPrimary: attribution.is_primary,
        status: isMod ? attribution.status : 'unverified',
        notes: attribution.notes,
        createdBy: api.userId,
      }))),
    ] as any)
  } else {
    const attributionStatus = isMod ? primaryAttribution?.status : 'unverified'
    const attributionId = await syncPrimaryAttribution(
      quoteId,
      authorId || null,
      referenceId || null,
      api.userId,
      attributionStatus,
      primaryAttribution?.notes,
    )
    await db.update(schema.quotes).set(updateData as any).where(eq(schema.quotes.id, quoteId)).run()
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
       ...(await getQuoteProvenance(quoteId)),
      tags: tags.map(t => ({ name: t.name, color: t.color })),
      created_at: updatedQuote!.createdAt,
      updated_at: updatedQuote!.updatedAt,
    },
    message: 'Quote updated successfully',
  }
})
