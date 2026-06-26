import { db, schema } from 'hub:db'
import { eq, and } from 'drizzle-orm'
import { toggleLike } from '../../../services/like.service'

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireAuth(event)

    const quoteId = parseIntParam(getRouterParam(event, 'id'))
    if (!quoteId) throwServer(400, 'Invalid quote ID')

    const quote = await db.select({ id: schema.quotes.id })
      .from(schema.quotes)
      .where(and(eq(schema.quotes.id, quoteId), eq(schema.quotes.status, 'approved')))
      .get()

    if (!quote) throwServer(404, 'Quote not found or not approved')

    const result = await toggleLike('quote', quoteId, user.id)

    return { success: true, data: result }
  } catch (error: any) {
    if ((error as any).statusCode) throw error
    console.error('Error toggling like:', error)
    throwServer(500, 'Failed to toggle like')
  }
})
