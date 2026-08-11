import { z } from 'zod'
import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'
import { hashPasswordWorker, verifyPasswordWorker } from '../../utils/password'
import { throwServer } from '../../utils/throw-server'

const bodySchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
})

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user?.id) {
    throwServer(401, 'Authentication required')
  }

  const body = await readValidatedBody(event, bodySchema.parse)
  const { currentPassword, newPassword } = body

  const ip = getRequestIP(event) || 'unknown'
  await requireRateLimit(event, `change-password:ip:${ip}`, 10, 3600, 'Too many password change attempts. Please try again later.')
  await requireRateLimit(event, `change-password:user:${session.user.id}`, 5, 3600, 'Too many password change attempts. Please try again later.')

  const user = await db
    .select({ id: schema.users.id, password: schema.users.password })
    .from(schema.users)
    .where(eq(schema.users.id, session.user.id))
    .get()

  if (!user) {
    throwServer(404, 'User not found')
  }

  if (!user.password || !(await verifyPasswordWorker(user.password, currentPassword))) {
    throwServer(400, 'Current password is incorrect')
  }

  const hashedPassword = await hashPasswordWorker(newPassword)

  await db.update(schema.users)
    .set({ password: hashedPassword, updatedAt: new Date() })
    .where(eq(schema.users.id, user.id))

  return { success: true, message: 'Password updated successfully' }
})
