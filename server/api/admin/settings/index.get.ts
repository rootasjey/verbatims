import { db, schema } from 'hub:db'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!session.user || !['admin', 'moderator'].includes(session.user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }

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
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch settings' })
  }
})
