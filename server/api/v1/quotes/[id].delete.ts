import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const api = event.context.api
  requireApiPermission(api, 'write:quotes')

  const quoteId = parseInt(getRouterParam(event, 'id') || '')
  if (isNaN(quoteId)) throwServer(400, 'Invalid quote ID')

  const quote = await db.select({
    id: schema.quotes.id,
    userId: schema.quotes.userId,
    status: schema.quotes.status,
  })
    .from(schema.quotes)
    .where(eq(schema.quotes.id, quoteId))
    .get()

  if (!quote) throwServer(404, 'Quote not found')

  const isMod = api.userRole === 'admin' || api.userRole === 'moderator'
  if (!isMod && quote!.userId !== api.userId) {
    throwServer(403, 'You can only delete your own quotes')
  }

  await db.delete(schema.quotes)
    .where(eq(schema.quotes.id, quoteId))
    .run()

  return {
    success: true,
    message: 'Quote deleted successfully',
  }
})
