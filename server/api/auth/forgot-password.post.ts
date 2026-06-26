import { z } from 'zod'
import { db, schema } from 'hub:db'
import { eq, and, isNull } from 'drizzle-orm'
import { sendPasswordResetEmail } from '../../utils/email'

const bodySchema = z.object({
  email: z.email(),
})

const TOKEN_EXPIRY_MS = 60 * 60 * 1000

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, bodySchema.parse)
  const { email } = body

  const ip = getRequestIP(event) || 'unknown'
  await requireRateLimit(event, `forgot-password:ip:${ip}`, 5, 3600, 'Too many password reset requests. Please try again later.')
  await requireRateLimit(event, `forgot-password:email:${email}`, 3, 3600)

  const user = await db
    .select({ id: schema.users.id, email: schema.users.email })
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .get()

  // Always return success to prevent email enumeration
  if (!user) {
    return { success: true, message: 'If an account with this email exists, we sent a reset link.' }
  }

  await db
    .update(schema.passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(and(
      eq(schema.passwordResetTokens.userId, user.id),
      isNull(schema.passwordResetTokens.usedAt),
    ))

  const token = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MS)

  await db.insert(schema.passwordResetTokens).values({
    userId: user.id,
    token,
    expiresAt,
  })

  await sendPasswordResetEmail(event, user.email, token)

  return { success: true, message: 'If an account with this email exists, we sent a reset link.' }
})