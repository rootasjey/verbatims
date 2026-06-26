import { db, schema } from 'hub:db'
import { sql, eq, and, inArray } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireModerator(event)

    const body = await readBody(event)

    if (!body.quote_ids || !Array.isArray(body.quote_ids) || body.quote_ids.length === 0) {
      throwServer(400, 'Quote IDs array is required')
    }

    if (body.quote_ids.length > 50) {
      throwServer(400, 'Cannot submit more than 50 quotes at once')
    }

    // Normalize and validate IDs
    const quoteIds: number[] = body.quote_ids.map((id: string | number) => {
      const numId = typeof id === 'number' ? id : parseInt(id)
      if (isNaN(numId)) {
        throwServer(400, 'All quote IDs must be valid numbers')
      }
      return numId
    })

    // Check existence and draft status
    const existing = await db.select({ id: schema.quotes.id, name: schema.quotes.name })
      .from(schema.quotes)
      .where(and(
        inArray(schema.quotes.id, quoteIds),
        eq(schema.quotes.status, 'draft')
      ))
      .all()

    if (existing.length !== quoteIds.length) {
      throwServer(400, 'Some quotes not found or not drafts')
    }

    // Minimum content validation similar to single submit
    const invalid = existing.find(q => !q.name || String(q.name).trim().length < 2)
    if (invalid) {
      throwServer(400, 'All quotes must have at least 2 characters before submission')
    }

    await Promise.all(quoteIds.map(id =>
      db.update(schema.quotes)
        .set({ 
          status: 'pending',
          updatedAt: sql`CURRENT_TIMESTAMP`
        })
        .where(eq(schema.quotes.id, id))
        .run()
    ))

    return {
      success: true,
      data: {
        processed_count: quoteIds.length,
        quote_ids: quoteIds
      },
      message: `${quoteIds.length} draft${quoteIds.length > 1 ? 's' : ''} submitted for review`
    }
  } catch (error: any) {
    if ((error as any).statusCode) {
      throw error
    }
    console.error('Bulk submit drafts error:', error)
    throwServer(500, 'Failed to submit drafts for review')
  }
})
