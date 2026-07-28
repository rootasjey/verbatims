import { db, schema } from 'hub:db'
import { eq, and } from 'drizzle-orm'
import { logActivity } from '~~/server/utils/activity-log'

defineRouteMeta({
  openAPI: {
    summary: 'Submit a quote for review',
    description: 'Submits a draft quote for moderation. Users can only submit their own quotes; moderators and admins can submit any quote. The quote becomes pending moderation.',
    tags: ['Quotes'],
    security: [{ apiKey: ['write:quotes'] }],
    parameters: [
      { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
    ],
    responses: {
      '200': { description: 'Quote submitted for review' },
      '400': { description: 'Invalid quote ID or quote too short' },
      '403': { description: 'Not authorized to submit this quote' },
      '404': { description: 'Quote not found or not a draft' },
    },
  },
})

export default defineEventHandler(async (event) => {
  const api = event.context.api
  requireApiPermission(api, 'write:quotes')

  const quoteId = parseInt(getRouterParam(event, 'id') || '')
  if (isNaN(quoteId)) throwServer(400, 'Invalid quote ID')

  const quote = await db.select()
    .from(schema.quotes)
    .where(and(
      eq(schema.quotes.id, quoteId),
      eq(schema.quotes.status, 'draft')
    ))
    .get()

  if (!quote) {
    throwServer(404, 'Quote not found or is not a draft')
  }

  const isMod = api.userRole === 'admin' || api.userRole === 'moderator'
  if (!isMod && quote.userId !== api.userId) {
    throwServer(403, 'You can only submit your own quotes for review')
  }

  await db.update(schema.quotes)
    .set({ status: 'pending', updatedAt: new Date() })
    .where(eq(schema.quotes.id, quoteId))
    .run()

  await logActivity(event, { type: 'quote_submitted', userId: api.userId, targetId: quoteId, targetType: 'quote', metadata: { status: 'pending', submitter_id: quote.userId, name: quote.name } })

  const updatedQuote = await db
    .select({
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
      authorId: schema.quotes.authorId,
      referenceId: schema.quotes.referenceId,
      userId: schema.quotes.userId,
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
    .select({ id: schema.tags.id, name: schema.tags.name, color: schema.tags.color })
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
      status: updatedQuote!.status,
      stats: {
        views: updatedQuote!.viewsCount,
        likes: updatedQuote!.likesCount,
        shares: updatedQuote!.sharesCount,
      },
      featured: updatedQuote!.isFeatured,
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
      tags: tags.map(t => ({ id: t.id, name: t.name, color: t.color })),
      created_at: updatedQuote!.createdAt,
      updated_at: updatedQuote!.updatedAt,
    },
    message: 'Quote submitted for moderation',
  }
})
