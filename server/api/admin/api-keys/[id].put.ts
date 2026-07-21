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
  if (body && typeof body.readRateLimit === 'number' && body.readRateLimit > 0) {
    updates.readRateLimit = body.readRateLimit
  }
  if (body && typeof body.readWindowSec === 'number' && body.readWindowSec > 0) {
    updates.readWindowSec = body.readWindowSec
  }
  if (body && typeof body.writeRateLimit === 'number' && body.writeRateLimit > 0) {
    updates.writeRateLimit = body.writeRateLimit
  }
  if (body && typeof body.writeWindowSec === 'number' && body.writeWindowSec > 0) {
    updates.writeWindowSec = body.writeWindowSec
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
