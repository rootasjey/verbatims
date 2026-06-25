import { z } from 'zod'
import { db, schema } from 'hub:db'
import { eq, and, isNull } from 'drizzle-orm'
import { sendVerificationEmail } from '../../utils/email'
import { throwServer } from '../../utils/throw-server'

const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user?.id) {
    throwServer(401, 'Authentication required')
  }

  const userId = session.user!.id

  const user = await db
    .select({ id: schema.users.id, email: schema.users.email, emailVerified: schema.users.emailVerified })
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .get()

  if (!user) {
    throwServer(404, 'User not found')
  }

  if (user.emailVerified) {
    throwServer(400, 'Email is already verified')
  }

  await db
    .update(schema.emailVerificationTokens)
    .set({ usedAt: new Date() })
    .where(and(
      eq(schema.emailVerificationTokens.userId, user.id),
      isNull(schema.emailVerificationTokens.usedAt),
    ))

  const token = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MS)

  await db.insert(schema.emailVerificationTokens).values({
    userId: user.id,
    token,
    expiresAt,
  })

  await sendVerificationEmail(event, user.email, token)

  return { success: true, message: 'Verification email sent' }
})