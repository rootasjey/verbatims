import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const { user } = await requireAuth(event)

  try {
    const userId = user!.id

    await db.delete(schema.users).where(eq(schema.users.id, userId))

    await clearUserSession(event)

    return { success: true, message: 'Account deleted successfully' }
  } catch (error: any) {
    if ((error as any).statusCode) throw error
    console.error('Error deleting account:', error)
    throwServer(500, 'Failed to delete account')
  }
})
