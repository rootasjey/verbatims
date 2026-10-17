import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'
import { updateProfileSchema } from '../../validation/schemas'

export default defineEventHandler(async (event) => {
  const { user } = await requireAuth(event)

  const body = await readValidatedBody(event, updateProfileSchema.parse)

  try {
    await db.update(schema.users)
      .set({
        name: body.name || user.name,
        biography: body.bio ?? undefined,
        avatarUrl: body.avatar_url,
        updatedAt: new Date()
      })
      .where(eq(schema.users.id, user.id))

    if (body.avatar_url !== undefined) {
      await setUserSession(event, {
        user: { ...user, avatar_url: body.avatar_url }
      })
    }

    return { success: true, message: 'Profile updated successfully' }
  } catch (error: any) {
    if ((error as any).statusCode) throw error
    console.error('Error updating profile:', error)
    throwServer(500, 'Failed to update profile')
  }
})
