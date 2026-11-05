import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'
import { requireApiKeyRole, requireApiPermission } from './api-key'
import type { ApiKeyData } from './api-key'

export function requireApiModerator(api: ApiKeyData, permission = 'write:quotes') {
  requireApiKeyRole(api, 'moderator', 'admin')
  requireApiPermission(api, permission)
}

export async function requireApiQuoteReadAccess(api: ApiKeyData, quoteId: number) {
  const quote = await db.select({ id: schema.quotes.id, status: schema.quotes.status })
    .from(schema.quotes)
    .where(eq(schema.quotes.id, quoteId))
    .get()

  if (!quote || (quote.status !== 'approved' && !['moderator', 'admin'].includes(api.userRole))) {
    throwServer(404, 'Quote not found')
  }

  return quote
}
