import { db, schema } from 'hub:db'
import { eq, and } from 'drizzle-orm'

const validPermissions = ['read', 'write:quotes', 'write:authors', 'write:references', 'write:collections', '*']

export default defineEventHandler(async (event) => {
  const { user } = await requireAuth(event)

  const id = parseInt(getRouterParam(event, 'id') || '')
  if (isNaN(id)) throwServer(400, 'Invalid API key ID')

  const existing = await db
    .select({ id: schema.apiKeys.id, tier: schema.apiKeys.tier, readRateLimit: schema.apiKeys.readRateLimit, readWindowSec: schema.apiKeys.readWindowSec, writeRateLimit: schema.apiKeys.writeRateLimit, writeWindowSec: schema.apiKeys.writeWindowSec })
    .from(schema.apiKeys)
    .where(and(eq(schema.apiKeys.id, id), eq(schema.apiKeys.userId, user.id)))
    .get()

  if (!existing) throwServer(404, 'API key not found')

  const tierMaxPerHour: Record<string, number> = {
    free: 1000,
    pro: 10000,
    enterprise: 100000,
  }

  const maxPerHour = tierMaxPerHour[existing.tier] ?? 1000

  const body = await readBody<Record<string, unknown>>(event)
  const updates: Record<string, unknown> = {}

  if (body && typeof body.name === 'string' && body.name.trim().length > 0) {
    updates.name = body.name.trim()
  }
  if (body && typeof body.isActive === 'boolean') {
    updates.isActive = body.isActive
  }
  if (body && Array.isArray(body.permissions) && body.permissions.length > 0) {
    const invalid = body.permissions.filter((p: string) => !validPermissions.includes(p))
    if (invalid.length > 0) {
      throwServer(400, `Invalid permissions: ${invalid.join(', ')}`)
    }
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

  // Normalize effective rate to requests per hour and validate against tier cap
  if (updates.readRateLimit || updates.readWindowSec) {
    const effectiveRate = (updates.readRateLimit as number) ?? existing.readRateLimit ?? 1000
    const effectiveWindow = (updates.readWindowSec as number) ?? existing.readWindowSec ?? 3600
    const perHour = Math.round((effectiveRate / effectiveWindow) * 3600)
    if (perHour > maxPerHour) {
      throwServer(400, `Effective rate of ${perHour} req/h exceeds the ${maxPerHour} req/h limit for ${existing.tier} tier`)
    }
  }
  if (updates.writeRateLimit || updates.writeWindowSec) {
    const effectiveRate = (updates.writeRateLimit as number) ?? existing.writeRateLimit ?? 1000
    const effectiveWindow = (updates.writeWindowSec as number) ?? existing.writeWindowSec ?? 3600
    const perHour = Math.round((effectiveRate / effectiveWindow) * 3600)
    if (perHour > maxPerHour) {
      throwServer(400, `Effective write rate of ${perHour} req/h exceeds the ${maxPerHour} req/h limit for ${existing.tier} tier`)
    }
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
