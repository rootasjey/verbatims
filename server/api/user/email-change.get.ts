import { and, desc, eq, gt, isNull } from 'drizzle-orm'
import { db, schema } from 'hub:db'

export default defineEventHandler(async (event) => {
  const { user } = await requireAuth(event)
  const pending = await db.select({
    email: schema.emailChangeTokens.newEmail,
    expiresAt: schema.emailChangeTokens.expiresAt,
  })
    .from(schema.emailChangeTokens)
    .where(and(
      eq(schema.emailChangeTokens.userId, user.id),
      isNull(schema.emailChangeTokens.usedAt),
      gt(schema.emailChangeTokens.expiresAt, new Date()),
    ))
    .orderBy(desc(schema.emailChangeTokens.createdAt))
    .limit(1)
    .get()

  return { pendingEmail: pending?.email ?? null, expiresAt: pending?.expiresAt ?? null }
})
