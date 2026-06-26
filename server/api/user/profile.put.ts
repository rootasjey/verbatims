import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const { user } = await requireAuth(event)

  const body = await readBody(event)
  const { name, bio } = body

  try {
    await db.update(schema.users)
      .set({
        name: name || user!.name,
        biography: bio || undefined,
        updatedAt: new Date()
      })
      .where(eq(schema.users.id, user!.id))

    return {
      success: true,
      data: { message: 'Profile updated successfully' }
    }
  } catch (error: any) {
    if ((error as any).statusCode) throw error
    console.error('Error updating profile:', error)
    throwServer(500, 'Failed to update profile')
  }
})
