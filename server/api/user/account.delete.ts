import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user) {
    throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
  }

  try {
    const userId = session.user.id

    await db.delete(schema.users).where(eq(schema.users.id, userId))

    await clearUserSession(event)

    return { success: true, message: 'Account deleted successfully' }
  } catch (error: any) {
    if ((error as any).statusCode) throw error
    console.error('Error deleting account:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to delete account' })
  }
})
