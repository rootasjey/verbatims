import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'
import { QUOTE_AUDIT_OUTCOMES, QUOTE_AUDIT_PROGRESS } from '#shared/constants/quote-audit'

export default defineEventHandler(async (event) => {
  const { user } = await requireModerator(event)
  const quoteId = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(quoteId) || quoteId < 1) {
    throwServer(400, 'Invalid quote ID')
  }

  const body = await readBody<{
    progress?: string
    outcome?: string | null
    notes?: string | null
  }>(event)

  if (!QUOTE_AUDIT_PROGRESS.includes(body.progress as typeof QUOTE_AUDIT_PROGRESS[number])) {
    throwServer(400, 'Invalid audit progress')
  }
  if (body.outcome !== undefined && body.outcome !== null && !QUOTE_AUDIT_OUTCOMES.includes(body.outcome as typeof QUOTE_AUDIT_OUTCOMES[number])) {
    throwServer(400, 'Invalid audit outcome')
  }
  if (body.notes !== undefined && body.notes !== null && (typeof body.notes !== 'string' || body.notes.length > 5000)) {
    throwServer(400, 'Audit notes must be at most 5000 characters')
  }

  const existingQuote = await db.select({ id: schema.quotes.id }).from(schema.quotes).where(eq(schema.quotes.id, quoteId)).get()
  if (!existingQuote) throwServer(404, 'Quote not found')

  const progress = body.progress as typeof QUOTE_AUDIT_PROGRESS[number]
  const reviewedAt = progress === 'reviewed' ? new Date() : null

  await db.insert(schema.quoteAuditReviews).values({
    quoteId,
    progress,
    outcome: (body.outcome ?? null) as typeof QUOTE_AUDIT_OUTCOMES[number] | null,
    notes: body.notes?.trim() || null,
    reviewedBy: progress === 'reviewed' ? user.id : null,
    reviewedAt,
    updatedAt: new Date(),
  }).onConflictDoUpdate({
    target: schema.quoteAuditReviews.quoteId,
    set: {
      progress,
      outcome: (body.outcome ?? null) as typeof QUOTE_AUDIT_OUTCOMES[number] | null,
      notes: body.notes?.trim() || null,
      reviewedBy: progress === 'reviewed' ? user.id : null,
      reviewedAt,
      updatedAt: new Date(),
    },
  })

  return { success: true }
})
