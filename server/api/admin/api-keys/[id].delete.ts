import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const id = parseInt(getRouterParam(event, 'id') || '')
  if (isNaN(id)) throwServer(400, 'Invalid API key ID')

  const existing = await db.select({ id: schema.apiKeys.id })
    .from(schema.apiKeys)
    .where(eq(schema.apiKeys.id, id))
    .get()

  if (!existing) throwServer(404, 'API key not found')

  await db.delete(schema.apiKeys).where(eq(schema.apiKeys.id, id)).run()

  return { success: true }
})
