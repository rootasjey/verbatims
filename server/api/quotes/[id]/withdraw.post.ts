import { db, schema } from 'hub:db'
import { eq, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const session = await requireUserSession(event)
    if (!session?.user) {
      throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
    }

    const idParam = getRouterParam(event, 'id')
    if (!idParam || isNaN(parseInt(idParam))) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid quote ID' })
    }
    const quoteId = Number(idParam)

    // Ensure the quote exists, belongs to the user, and is currently pending
    const quote = await db.select({ id: schema.quotes.id })
      .from(schema.quotes)
      .where(and(
        eq(schema.quotes.id, quoteId),
        eq(schema.quotes.userId, session.user.id),
        eq(schema.quotes.status, 'pending')
      ))
      .get()

    if (!quote) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Quote not found, not pending, or you do not have permission to withdraw it'
      })
    }

    // Move back to draft and clear moderation fields
    const result = await db.update(schema.quotes)
      .set({
        status: 'draft',
        moderatorId: null,
        moderatedAt: null,
        rejectionReason: null
      })
      .where(and(
        eq(schema.quotes.id, quoteId),
        eq(schema.quotes.userId, session.user.id),
        eq(schema.quotes.status, 'pending')
      ))

    const changes = result ? 1 : 0

    return {
      success: true,
      updatedCount: changes,
      updatedIds: [quoteId],
      skippedIds: [],
      message: 'Quote withdrawn to drafts'
    }
  } catch (error: any) {
    if (error?.statusCode) throw error
    console.error('Withdraw quote error:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to withdraw quote' })
  }
})
