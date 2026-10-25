import { eq } from 'drizzle-orm'
import { db, schema } from 'hub:db'

const modes = ['auto', 'expanded', 'collapsed'] as const

export default defineEventHandler(async (event) => {
  const { user } = await requireAuth(event)
  const body = await readBody<{ mode?: unknown }>(event)

  if (!modes.includes(body?.mode as typeof modes[number])) {
    throwServer(400, 'Invalid image attribution preference')
  }

  try {
    const key = `user_${user!.id}_home_image_attribution`
    const existing = await db.select()
      .from(schema.settings)
      .where(eq(schema.settings.key, key))
      .limit(1)

    const value = JSON.stringify({ mode: body.mode })
    if (existing[0]) {
      await db.update(schema.settings)
        .set({ value, updatedAt: new Date() })
        .where(eq(schema.settings.key, key))
    } else {
      await db.insert(schema.settings).values({ key, value, updatedAt: new Date() })
    }

    return { success: true, data: { mode: body.mode } }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('Error saving image attribution preference:', error)
    throwServer(500, 'Failed to save image attribution preference')
  }
})
