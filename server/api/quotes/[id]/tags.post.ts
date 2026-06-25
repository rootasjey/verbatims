import { db, schema } from 'hub:db'
import { eq, and, sql } from 'drizzle-orm'
import { getTagById, isCuratedTagName } from '~~/server/utils/tagging'

export default defineEventHandler(async (event) => {
  try {
    const session = await requireUserSession(event)
    if (!session.user) throwServer(401, 'Authentication required')

    const quoteId = getRouterParam(event, 'id')
    if (!quoteId || isNaN(parseInt(quoteId))) {
      throwServer(400, 'Invalid quote ID')
    }

    const body = await readBody(event)
    const { tagId, name } = body || {}
    if (!tagId && !name) {
      throwServer(400, 'Provide tagId or name')
    }

    // Check permissions: owner of draft or admin/moderator can edit tags
    const quote = await db.select({
      userId: schema.quotes.userId,
      status: schema.quotes.status
    })
    .from(schema.quotes)
    .where(eq(schema.quotes.id, parseInt(quoteId)))
    .get()

    if (!quote) throwServer(404, 'Quote not found')
    const isPrivileged = session.user.role === 'admin' || session.user.role === 'moderator'
    const isAdminUser = session.user.role === 'admin'
    const isOwnerDraft = quote.userId === session.user.id && quote.status === 'draft'
    if (!isPrivileged && !isOwnerDraft) {
      throwServer(403, 'Not allowed to edit tags for this quote')
    }

    let finalTagId = tagId

    if (!finalTagId) {
      // Find existing tag by name (case-insensitive)
      const existing = await db.select({
        id: schema.tags.id,
        name: schema.tags.name,
        color: schema.tags.color
      })
      .from(schema.tags)
      .where(sql`LOWER(${schema.tags.name}) = LOWER(${String(name).trim()})`)
      .get()

      if (!existing && isAdminUser) {
        const inserted = await db.insert(schema.tags).values({
          name: String(name).trim(),
          color: '#687FE5'
        }).returning({ id: schema.tags.id }).get()

        finalTagId = inserted.id
      } else if (!existing) {
        throwServer(400, 'Only admins can create new tags. Please select an existing curated tag.')
      } else if (!isCuratedTagName(existing.name) && !isAdminUser) {
        throwServer(400, 'This tag is not part of the curated taxonomy.')
      } else {
        finalTagId = existing.id
      }
    }

    const selectedTag = await getTagById(finalTagId)
    if (!selectedTag) {
      throwServer(404, 'Tag not found')
    }

    if (!isCuratedTagName(selectedTag.name) && !isAdminUser) {
      throwServer(400, 'Only curated tags can be added to quotes.')
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
    throwServer(500, 'Failed to add tag to quote')
  }
})
