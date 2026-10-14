import { z } from 'zod'
import { and, eq, isNull, sql } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { sendEmailChangeVerificationEmail } from '../../utils/email'
import { createEmailChangeToken, EMAIL_CHANGE_TOKEN_EXPIRY_MS, hashEmailChangeToken } from '../../utils/email-change'

const bodySchema = z.object({ email: z.email().max(254) })

export default defineEventHandler(async (event) => {
  const { user } = await requireAuth(event)
  const body = await readValidatedBody(event, bodySchema.parse)
  const email = body.email.trim().toLowerCase()

  const ip = getRequestIP(event) || 'unknown'
  await requireRateLimit(event, `email-change:ip:${ip}`, 5, 3600, 'Too many email change requests. Please try again later.')
  await requireRateLimit(event, `email-change:user:${user.id}`, 3, 3600, 'Too many email change requests. Please try again later.')

  const currentUser = await db.select({ id: schema.users.id, email: schema.users.email })
    .from(schema.users)
    .where(eq(schema.users.id, user.id))
    .get()

  if (!currentUser) throwServer(404, 'User not found')
  if (currentUser.email.trim().toLowerCase() === email) {
    throwServer(400, 'The new email address matches your current address')
  }

  const existingUser = await db.select({ id: schema.users.id })
    .from(schema.users)
    .where(sql`lower(${schema.users.email}) = ${email}`)
    .get()
  if (existingUser) throwServer(409, 'This email address is already in use')

  const now = new Date()
  await db.update(schema.emailChangeTokens)
    .set({ usedAt: now })
    .where(and(
      eq(schema.emailChangeTokens.userId, user.id),
      isNull(schema.emailChangeTokens.usedAt),
    ))

  const token = createEmailChangeToken()
  const tokenHash = await hashEmailChangeToken(token)
  const expiresAt = new Date(Date.now() + EMAIL_CHANGE_TOKEN_EXPIRY_MS)
  const tokenRecord = await db.insert(schema.emailChangeTokens)
    .values({ userId: user.id, newEmail: email, tokenHash, expiresAt })
    .returning({ id: schema.emailChangeTokens.id })
    .get()

  try {
    await sendEmailChangeVerificationEmail(event, email, token)
  } catch (error) {
    await db.update(schema.emailChangeTokens)
      .set({ usedAt: new Date() })
      .where(eq(schema.emailChangeTokens.id, tokenRecord.id))
    throw error
  }

  return { success: true, pendingEmail: email, expiresAt }
})
