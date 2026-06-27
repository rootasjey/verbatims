import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const id = parseInt(getRouterParam(event, 'id') || '')
  if (isNaN(id)) throwServer(400, 'Invalid API key ID')

  const body = await readBody<Record<string, unknown>>(event)
  const updates: Record<string, unknown> = {}

  if (body && typeof body.name === 'string' && body.name.trim().length > 0) {
    updates.name = body.name.trim()
  }
  if (body && Array.isArray(body.permissions)) {
    updates.permissions = JSON.stringify(body.permissions)
  }
  if (body && typeof body.rateLimit === 'number' && body.rateLimit > 0) {
    updates.rateLimit = body.rateLimit
  }
  if (body && typeof body.windowSec === 'number' && body.windowSec > 0) {
    updates.windowSec = body.windowSec
  }
  if (body && typeof body.isActive === 'boolean') {
    updates.isActive = body.isActive
  }
  if (body && (body.tier === 'free' || body.tier === 'pro' || body.tier === 'enterprise')) {
    updates.tier = body.tier
  }

  if (Object.keys(updates).length === 0) {
    throwServer(400, 'No valid fields to update')
  }

  await db.update(schema.apiKeys)
    .set(updates)
    .where(eq(schema.apiKeys.id, id))
    .run()

  return { success: true }
})
