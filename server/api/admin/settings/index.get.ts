import { db, schema } from 'hub:db'

export default defineEventHandler(async (event) => {
  const { user } = await requireModerator(event)

  try {
    const rows = await db.select()
      .from(schema.settings)
      .all()

    const result: Record<string, string> = {}
    for (const r of rows) {
      result[r.key] = r.value
    }

    return { success: true, data: result }
  } catch (error) {
    console.error('Error fetching settings:', error)
    throwServer(500, 'Failed to fetch settings')
  }
})
