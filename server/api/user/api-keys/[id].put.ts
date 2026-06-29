import { db, schema } from 'hub:db'
import { eq, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const { user } = await requireAuth(event)

  const id = parseInt(getRouterParam(event, 'id') || '')
  if (isNaN(id)) throwServer(400, 'Invalid API key ID')

  const existing = await db
    .select({ id: schema.apiKeys.id, tier: schema.apiKeys.tier, rateLimit: schema.apiKeys.rateLimit, windowSec: schema.apiKeys.windowSec })
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
  if (body && typeof body.rateLimit === 'number' && body.rateLimit > 0) {
    updates.rateLimit = body.rateLimit
  }
  if (body && typeof body.windowSec === 'number' && body.windowSec > 0) {
    updates.windowSec = body.windowSec
  }

  // Normalize effective rate to requests per hour and validate against tier cap
  if (updates.rateLimit || updates.windowSec) {
    const effectiveRate = (updates.rateLimit as number) ?? existing.rateLimit ?? 1000
    const effectiveWindow = (updates.windowSec as number) ?? existing.windowSec ?? 3600
    const perHour = Math.round((effectiveRate / effectiveWindow) * 3600)
    if (perHour > maxPerHour) {
      throwServer(400, `Effective rate of ${perHour} req/h exceeds the ${maxPerHour} req/h limit for ${existing.tier} tier`)
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
