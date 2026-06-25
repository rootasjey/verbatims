import { z } from 'zod'
import { db, schema } from 'hub:db'
import { eq, and, gt, isNull } from 'drizzle-orm'

const bodySchema = z.object({
  token: z.string().min(1),
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, bodySchema.parse)
  const { token } = body

  const verificationToken = await db
    .select()
    .from(schema.emailVerificationTokens)
    .where(and(
      eq(schema.emailVerificationTokens.token, token),
      isNull(schema.emailVerificationTokens.usedAt),
      gt(schema.emailVerificationTokens.expiresAt, new Date()),
    ))
    .get()

  if (!verificationToken) {
    throwServer(400, 'Invalid or expired verification token')
  }

  await db.update(schema.users)
    .set({ emailVerified: true, updatedAt: new Date() })
    .where(eq(schema.users.id, verificationToken.userId))

  await db.update(schema.emailVerificationTokens)
    .set({ usedAt: new Date() })
    .where(eq(schema.emailVerificationTokens.id, verificationToken.id))

  const session = await getUserSession(event)
  if (session?.user?.id === verificationToken.userId) {
    await setUserSession(event, {
      user: { ...session.user, email_verified: true },
    })
  }

  return { message: 'Email verified successfully' }
})