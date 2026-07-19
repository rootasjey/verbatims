import { db, schema } from 'hub:db'
import { eq, sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  await requireModerator(event)

  const all = await db.select({ id: schema.themeContentFilters.id, type: schema.themeContentFilters.type, value: schema.themeContentFilters.value })
    .from(schema.themeContentFilters)
    .where(eq(schema.themeContentFilters.themeId, 31))

  const seen = new Set<string>()
  const toDelete: number[] = []
  for (const f of all) {
    const key = `${f.type}:${f.value.toLowerCase()}`
    if (seen.has(key)) toDelete.push(f.id)
    else seen.add(key)
  }

  for (const id of toDelete) {
    await db.delete(schema.themeContentFilters).where(eq(schema.themeContentFilters.id, id))
  }

  return { success: true, data: { total: all.length, removed: toDelete.length, kept: all.length - toDelete.length } }
})
