import { db, schema } from 'hub:db'
import { eq, and, sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const session = await requireUserSession(event)
    if (!session.user) throw createError({ statusCode: 401, statusMessage: 'Authentication required' })

    const quoteId = getRouterParam(event, 'id')
    if (!quoteId || isNaN(parseInt(quoteId))) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid quote ID' })
    }

    const body = await readBody(event)
    const { tagId, name, color } = body || {}
    if (!tagId && !name) {
      throw createError({ statusCode: 400, statusMessage: 'Provide tagId or name' })
    }

    // Check permissions: owner of draft or admin/moderator can edit tags
    const quote = await db.select({
      userId: schema.quotes.userId,
      status: schema.quotes.status
    })
    .from(schema.quotes)
    .where(eq(schema.quotes.id, parseInt(quoteId)))
    .get()

    if (!quote) throw createError({ statusCode: 404, statusMessage: 'Quote not found' })
    const isAdmin = session.user.role === 'admin' || session.user.role === 'moderator'
    const isOwnerDraft = quote.userId === session.user.id && quote.status === 'draft'
    if (!isAdmin && !isOwnerDraft) {
      throw createError({ statusCode: 403, statusMessage: 'Not allowed to edit tags for this quote' })
    }

    let finalTagId = tagId

    if (!finalTagId) {
      // Create or find tag by name (case-insensitive)
      const existing = await db.select({
        id: schema.tags.id,
        name: schema.tags.name,
        color: schema.tags.color
      })
      .from(schema.tags)
      .where(sql`LOWER(${schema.tags.name}) = LOWER(${String(name).trim()})`)
      .get()

      if (existing) {
        finalTagId = existing.id
      } else {
        const result = await db.insert(schema.tags).values({
          name: String(name).trim(),
          color: color || '#687FE5'
        }).returning({ id: schema.tags.id }).get()
        finalTagId = result.id
      }
    }

    // Attach relation (ignore duplicates)
    await db.insert(schema.quoteTags).values({
      quoteId: parseInt(quoteId),
      tagId: finalTagId
    }).onConflictDoNothing().run()

    const tag = await db.select({
      id: schema.tags.id,
      name: schema.tags.name,
      color: schema.tags.color
    })
    .from(schema.tags)
    .where(eq(schema.tags.id, finalTagId))
    .get()

    return { success: true, data: tag }
  } catch (error: any) {
    if ((error as any).statusCode) throw error
    console.error('Error adding tag to quote:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to add tag to quote' })
  }
})
