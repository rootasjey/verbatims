import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user) {
    throwServer(401, 'Authentication required')
  }

  try {
    const result = await db.select()
      .from(schema.settings)
      .where(eq(schema.settings.key, `user_${session.user!.id}_notifications`))
      .limit(1)

    const defaults = { quote_approval: true, collection_updates: true, weekly_digest: false }
    const stored = result[0] ? JSON.parse(result[0].value) : {}

    return {
      success: true,
      data: { ...defaults, ...stored }
    }
  } catch (error: any) {
    if ((error as any).statusCode) throw error
    console.error('Error loading notification settings:', error)
    throwServer(500, 'Failed to load notification settings')
  }
})
