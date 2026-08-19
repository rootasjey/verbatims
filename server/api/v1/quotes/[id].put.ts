import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'
import { updateV1QuoteSchema } from '../../../validation/schemas'
import { logActivity } from '~~/server/utils/activity-log'
import { syncPrimaryAttribution, syncPrimarySource, getQuoteProvenance } from '~~/server/utils/quote-provenance'

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
              provenance: { type: 'object', description: 'Primary quote attribution and source provenance', properties: { author_id: { type: 'integer', nullable: true }, reference_id: { type: 'integer', nullable: true }, status: { type: 'string', enum: ['unverified', 'manually_verified', 'externally_verified', 'disputed'] }, notes: { type: 'string', nullable: true }, source: { type: 'object', properties: { source_type: { type: 'string' }, source_url: { type: 'string', format: 'uri', nullable: true }, label: { type: 'string', nullable: true }, verification_status: { type: 'string', enum: ['unverified', 'manually_verified', 'externally_verified', 'disputed'] }, notes: { type: 'string', nullable: true } } } } },
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
  const isOwner = existingQuote!.userId === api.userId
  if (!isMod && !isOwner) throwServer(403, 'You can only update your own quotes')

  const currentProvenance = await getQuoteProvenance(quoteId)
  const primaryAttribution = currentProvenance.attributions.find(item => item.is_primary) ?? currentProvenance.attributions[0]
  let authorId = primaryAttribution?.author_id ?? null
  let referenceId = primaryAttribution?.reference_id ?? null

  if (body.provenance?.author_id !== undefined) authorId = body.provenance.author_id
  if (body.provenance?.reference_id !== undefined) referenceId = body.provenance.reference_id

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

  const provenanceSource = body.provenance?.source

  if (authorId == null && referenceId == null) {
    throwServer(400, 'A quote requires an author or reference')
  }

  const updateData: Record<string, unknown> = {
    ...(body.name !== undefined ? { name: body.name } : {}),
    ...(body.language !== undefined ? { language: body.language } : {}),
    updatedAt: new Date(),
  }

  await db.update(schema.quotes)
    .set({
      ...updateData,
    } as any)
    .where(eq(schema.quotes.id, quoteId))
    .run()

  const attributionStatus = isMod ? body.provenance?.status : 'unverified'
  const attributionId = await syncPrimaryAttribution(
    quoteId,
    authorId || null,
    referenceId || null,
    api.userId,
    attributionStatus,
    body.provenance?.notes,
  )
  await syncPrimarySource(
    quoteId,
    attributionId,
    provenanceSource?.source_type,
    provenanceSource?.source_url,
    api.userId,
    isMod ? provenanceSource?.verification_status : 'unverified',
    provenanceSource?.label,
    provenanceSource?.notes,
  )

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
      sourceType: schema.quotes.sourceType,
      sourceUrl: schema.quotes.sourceUrl,
      createdAt: schema.quotes.createdAt,
      updatedAt: schema.quotes.updatedAt,
      authorId: schema.quotes.authorId,
      referenceId: schema.quotes.referenceId,
      authorName: schema.authors.name,
      authorIsFictional: schema.authors.isFictional,
      authorImageUrl: schema.authors.imageUrl,
      authorDescription: schema.authors.description,
      referenceName: schema.quoteReferences.name,
      referencePrimaryType: schema.quoteReferences.primaryType,
      referenceImageUrl: schema.quoteReferences.imageUrl,
      referenceDescription: schema.quoteReferences.description,
    })
    .from(schema.quotes)
    .leftJoin(schema.authors, eq(schema.quotes.authorId, schema.authors.id))
    .leftJoin(schema.quoteReferences, eq(schema.quotes.referenceId, schema.quoteReferences.id))
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
