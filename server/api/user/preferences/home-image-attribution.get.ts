import { eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'

export default defineEventHandler(async (event) => {
  const { user } = await requireAuth(event)

  try {
    const result = await db.select()
      .from(schema.settings)
      .where(eq(schema.settings.key, `user_${user!.id}_home_image_attribution`))
      .limit(1)

    const stored = result[0] ? JSON.parse(result[0].value) : {}
    const mode = ['auto', 'expanded', 'collapsed'].includes(stored.mode) ? stored.mode : 'auto'

    return { success: true, data: { mode } }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('Error loading image attribution preference:', error)
    throwServer(500, 'Failed to load image attribution preference')
  }
})
