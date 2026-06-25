import { z } from 'zod'
import { db, schema } from 'hub:db'
import { eq, and, gt, isNull } from 'drizzle-orm'
import { hashPasswordWorker } from '../../utils/password'

const bodySchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, bodySchema.parse)
  const { token, password } = body

  const resetToken = await db
    .select()
    .from(schema.passwordResetTokens)
    .where(and(
      eq(schema.passwordResetTokens.token, token),
      isNull(schema.passwordResetTokens.usedAt),
      gt(schema.passwordResetTokens.expiresAt, new Date()),
    ))
    .get()

  if (!resetToken) {
    throwServer(400, 'Invalid or expired reset token')
  }

  const user = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.id, resetToken.userId))
    .get()

  if (!user) {
    throwServer(404, 'User not found')
  }

  const hashedPassword = await hashPasswordWorker(password)

  await db.update(schema.users)
    .set({ password: hashedPassword, updatedAt: new Date() })
    .where(eq(schema.users.id, user.id))

  await db.update(schema.passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(eq(schema.passwordResetTokens.id, resetToken.id))

  return { success: true, message: 'Password reset successfully' }
})