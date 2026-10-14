import { z } from 'zod'
import { and, eq, exists, gt, isNull, ne, sql } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { hashEmailChangeToken } from '../../utils/email-change'

const bodySchema = z.object({ token: z.string().length(64) })

export default defineEventHandler(async (event) => {
  const { token } = await readValidatedBody(event, bodySchema.parse)
  const tokenHash = await hashEmailChangeToken(token)
  const now = new Date()

  const pending = await db.select()
    .from(schema.emailChangeTokens)
    .where(and(
      eq(schema.emailChangeTokens.tokenHash, tokenHash),
      isNull(schema.emailChangeTokens.usedAt),
      gt(schema.emailChangeTokens.expiresAt, now),
    ))
    .get()

  if (!pending) throwServer(400, 'This email change link is invalid or has expired')

  const conflictingUser = await db.select({ id: schema.users.id })
    .from(schema.users)
    .where(and(
      ne(schema.users.id, pending.userId),
      sql`lower(${schema.users.email}) = ${pending.newEmail.toLowerCase()}`,
    ))
    .get()
  if (conflictingUser) throwServer(409, 'This email address is already in use')

  const validToken = db.select({ id: schema.emailChangeTokens.id })
    .from(schema.emailChangeTokens)
    .where(and(
      eq(schema.emailChangeTokens.id, pending.id),
      eq(schema.emailChangeTokens.userId, pending.userId),
      isNull(schema.emailChangeTokens.usedAt),
      gt(schema.emailChangeTokens.expiresAt, now),
    ))

  try {
    await db.batch([
      db.update(schema.users)
        .set({ email: pending.newEmail, emailVerified: true, updatedAt: now })
        .where(and(eq(schema.users.id, pending.userId), exists(validToken))),
      db.update(schema.emailChangeTokens)
        .set({ usedAt: now })
        .where(and(
          eq(schema.emailChangeTokens.id, pending.id),
          isNull(schema.emailChangeTokens.usedAt),
          gt(schema.emailChangeTokens.expiresAt, now),
        )),
    ] as any)
  } catch (error) {
    if (String(error).toLowerCase().includes('unique')) {
      throwServer(409, 'This email address is already in use')
    }
    throw error
  }

  const session = await getUserSession(event)
  if (session?.user?.id === pending.userId) {
    await setUserSession(event, {
      user: { ...session.user, email: pending.newEmail, email_verified: true },
    })
  }

  return { success: true, email: pending.newEmail }
})
