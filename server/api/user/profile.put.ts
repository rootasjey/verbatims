import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user) {
    throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
  }

  const body = await readBody(event)
  const { name, bio } = body

  try {
    await db.update(schema.users)
      .set({
        name: name || session.user.name,
        biography: bio || undefined,
        updatedAt: new Date()
      })
      .where(eq(schema.users.id, session.user.id))

    return {
      success: true,
      data: { message: 'Profile updated successfully' }
    }
  } catch (error: any) {
    if ((error as any).statusCode) throw error
    console.error('Error updating profile:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to update profile' })
  }
})
