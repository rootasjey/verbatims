import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'
import { updateQuoteSchema } from '../../../validation/schemas'

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
              author_id: { type: 'integer', nullable: true },
              reference_id: { type: 'integer', nullable: true },
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

  const body = await readValidatedBody(event, updateQuoteSchema.parse)

  const existingQuote = await db.select().from(schema.quotes).where(eq(schema.quotes.id, quoteId)).get()
  if (!existingQuote) throwServer(404, 'Quote not found')

  const isMod = api.userRole === 'admin' || api.userRole === 'moderator'
  const isOwner = existingQuote!.userId === api.userId
  if (!isMod && !isOwner) throwServer(403, 'You can only update your own quotes')

  let authorId = body.author_id
  let referenceId = body.reference_id

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

  await db.update(schema.quotes)
    .set({
      name: body.name,
      language: body.language || 'en',
      authorId: authorId || null,
      referenceId: referenceId || null,
      updatedAt: new Date()
    } as any)
    .where(eq(schema.quotes.id, quoteId))
    .run()

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
      source: updatedQuote!.sourceType ? {
        type: updatedQuote!.sourceType,
        url: updatedQuote!.sourceUrl,
      } : null,
      author: updatedQuote!.authorId ? {
        id: updatedQuote!.authorId,
        name: updatedQuote!.authorName,
        fictional: updatedQuote!.authorIsFictional,
        image_url: updatedQuote!.authorImageUrl,
        description: updatedQuote!.authorDescription,
      } : null,
      reference: updatedQuote!.referenceId ? {
        id: updatedQuote!.referenceId,
        name: updatedQuote!.referenceName,
        type: updatedQuote!.referencePrimaryType,
        image_url: updatedQuote!.referenceImageUrl,
        description: updatedQuote!.referenceDescription,
      } : null,
      tags: tags.map(t => ({ name: t.name, color: t.color })),
      created_at: updatedQuote!.createdAt,
      updated_at: updatedQuote!.updatedAt,
    },
    message: 'Quote updated successfully',
  }
})
