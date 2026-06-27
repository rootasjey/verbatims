import { db, schema } from 'hub:db'
import { eq, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const { user } = await requireAuth(event)

  const id = parseInt(getRouterParam(event, 'id') || '')
  if (isNaN(id)) throwServer(400, 'Invalid API key ID')

  const existing = await db
    .select({ id: schema.apiKeys.id })
    .from(schema.apiKeys)
    .where(and(eq(schema.apiKeys.id, id), eq(schema.apiKeys.userId, user.id)))
    .get()

  if (!existing) throwServer(404, 'API key not found')

  const body = await readBody<Record<string, unknown>>(event)
  const updates: Record<string, unknown> = {}

  if (body && typeof body.name === 'string' && body.name.trim().length > 0) {
    updates.name = body.name.trim()
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
