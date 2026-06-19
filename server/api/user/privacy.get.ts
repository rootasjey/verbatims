import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user) {
    throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
  }

  try {
    const result = await db.select()
      .from(schema.settings)
      .where(eq(schema.settings.key, `user_${session.user.id}_privacy`))
      .limit(1)

    const defaults = { public_profile: true, show_attribution: true }
    const stored = result[0] ? JSON.parse(result[0].value) : {}

    return {
      success: true,
      data: { ...defaults, ...stored }
    }
  } catch (error: any) {
    if ((error as any).statusCode) throw error
    console.error('Error loading privacy settings:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to load privacy settings' })
  }
})
