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

  await db.delete(schema.apiKeys).where(eq(schema.apiKeys.id, id)).run()

  return { success: true }
})
