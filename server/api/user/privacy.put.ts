import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const { user } = await requireAuth(event)

  const body = await readBody(event)

  try {
    const key = `user_${user!.id}_privacy`
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
      data: { message: 'Privacy settings saved successfully' }
    }
  } catch (error: any) {
    if ((error as any).statusCode) throw error
    console.error('Error saving privacy settings:', error)
    throwServer(500, 'Failed to save privacy settings')
  }
})
