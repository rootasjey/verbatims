import { db, schema } from 'hub:db'
import { eq, sql, and, inArray } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user) throwServer(401, 'Authentication required')
  if (session.user.role !== 'admin' && session.user.role !== 'moderator') {
    throwServer(403, 'Admin or moderator access required')
  }
  const user = session.user

  const body = await readBody(event)
  const { quote_ids, new_status } = body as {
    quote_ids: number[]
    new_status?: string
  }

  if (!Array.isArray(quote_ids) || quote_ids.length === 0) {
    throwServer(400, 'quote_ids array is required and must not be empty')
  }

const targetStatus = new_status || 'draft'
  if (targetStatus !== 'draft' && targetStatus !== 'pending') {
    throwServer(400, 'new_status must be "draft" or "pending"')
  }

  const statusValue = targetStatus as 'draft' | 'pending'

  const result = await db.update(schema.quotes)
    .set({
      status: statusValue,
      moderatorId: user.id,
      moderatedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(
      inArray(schema.quotes.id, quote_ids),
      eq(schema.quotes.status, 'harvested'),
    ))
    .execute()

  const approvedCount = result?.rowsAffected ?? 0

  return {
    success: true,
    data: {
      approved: approvedCount,
      targetStatus,
    },
  }
})