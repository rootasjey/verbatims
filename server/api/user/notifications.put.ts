import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user) {
    throwServer(401, 'Authentication required')
  }

  const body = await readBody(event)

  try {
    const key = `user_${session.user!.id}_notifications`
    const existing = await db.select()
      .from(schema.settings)
      .where(eq(schema.settings.key, key))
      .limit(1)

    if (existing[0]) {
      await db.update(schema.settings)
        .set({ value: JSON.stringify(body), updatedAt: new Date() })
        .where(eq(schema.settings.key, key))
    } else {
      await db.insert(schema.settings)
        .values({ key, value: JSON.stringify(body), updatedAt: new Date() })
    }

    return {
      success: true,
      data: { message: 'Notification preferences saved successfully' }
    }
  } catch (error: any) {
    if ((error as any).statusCode) throw error
    console.error('Error saving notification settings:', error)
    throwServer(500, 'Failed to save notification settings')
  }
})
