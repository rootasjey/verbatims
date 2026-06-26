import { db, schema } from 'hub:db'
import { sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const { user } = await requireAdmin(event)

  try {
    const body = await readBody(event)
    const settings = body?.settings as Record<string, string> | undefined
    if (!settings || typeof settings !== 'object') {
      throwServer(400, 'Body must contain a settings object')
    }

    for (const [key, value] of Object.entries(settings!)) {
      if (typeof value !== 'string') continue
      await db.run(sql`INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (${key}, ${value}, CAST(unixepoch() AS INTEGER))`)
    }

    return { success: true }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('Error updating settings:', error)
    throwServer(500, 'Failed to update settings')
  }
})
