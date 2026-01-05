import { db, schema } from 'hub:db'
import { eq, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const session = await requireUserSession(event)
    if (!session.user) throw createError({ statusCode: 401, statusMessage: 'Authentication required' })

    const quoteId = getRouterParam(event, 'id')
    const tagId = getRouterParam(event, 'tagId')
    if (!quoteId || isNaN(parseInt(quoteId)) || !tagId || isNaN(parseInt(tagId))) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid identifiers' })
    }

    const quote = await db.select({
      userId: schema.quotes.userId,
      status: schema.quotes.status
    })
    .from(schema.quotes)
    .where(eq(schema.quotes.id, parseInt(quoteId)))
    .get()

    if (!quote) throw createError({ statusCode: 404, statusMessage: 'Quote not found' })

    const isAdmin = session.user.role === 'admin' || session.user.role === 'moderator'
    const isOwnerDraft = quote.userId === session.user.id && quote.status === 'draft'
    if (!isAdmin && !isOwnerDraft) {
      throw createError({ statusCode: 403, statusMessage: 'Not allowed to edit tags for this quote' })
    }

    await db.delete(schema.quoteTags)
      .where(and(
        eq(schema.quoteTags.quoteId, parseInt(quoteId)),
        eq(schema.quoteTags.tagId, parseInt(tagId))
      ))
      .run()

    return { success: true }
  } catch (error: any) {
    if ((error as any).statusCode) throw error
    console.error('Error removing tag from quote:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to remove tag from quote' })
  }
})
