import { db, schema } from 'hub:db'
import { eq, inArray } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const session = await requireUserSession(event)
    if (!session || !session.user) {
      throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
    }
    if (session.user.role !== 'admin' && session.user.role !== 'moderator') {
      throw createError({ statusCode: 403, statusMessage: 'Admin or moderator access required' })
    }

    const body = await readBody(event)

    if (!body.quote_ids || !Array.isArray(body.quote_ids) || body.quote_ids.length === 0) {
      throw createError({ statusCode: 400, statusMessage: 'Quote IDs array is required' })
    }

    if (body.quote_ids.length > 50) {
      throw createError({ statusCode: 400, statusMessage: 'Cannot edit more than 50 quotes at once' })
    }

    let hasUpdate = false
    const updateData: Record<string, unknown> = {}

    // Normalize and validate IDs
    const quoteIds: number[] = body.quote_ids.map((id: string | number) => {
      const numId = typeof id === 'number' ? id : parseInt(id)
      if (isNaN(numId)) {
        throw createError({ statusCode: 400, statusMessage: 'All quote IDs must be valid numbers' })
      }
      return numId
    })

    // Language update
    if (body.language !== undefined) {
      const validLanguages = ['en', 'fr', 'es', 'de', 'it', 'pt', 'ru', 'ja', 'zh', 'la']
      if (!validLanguages.includes(body.language)) {
        throw createError({ statusCode: 400, statusMessage: `Invalid language: ${body.language}` })
      }
      updateData.language = body.language
      hasUpdate = true
    }

    // Author update
    if (body.author_id !== undefined) {
      updateData.authorId = body.author_id || null
      hasUpdate = true
    } else if (body.new_author && body.new_author.name) {
      const newAuthor = await db.insert(schema.authors).values({
        name: body.new_author.name.trim(),
        isFictional: body.new_author.is_fictional || false,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning({ id: schema.authors.id }).get()

      updateData.authorId = newAuthor.id
      hasUpdate = true
    }

    // Reference update
    if (body.reference_id !== undefined) {
      updateData.referenceId = body.reference_id || null
      hasUpdate = true
    } else if (body.new_reference && body.new_reference.name) {
      const newReference = await db.insert(schema.quoteReferences).values({
        name: body.new_reference.name.trim(),
        originalLanguage: body.new_reference.original_language || body.language || 'en',
        primaryType: body.new_reference.primary_type || 'other',
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning({ id: schema.quoteReferences.id }).get()

      updateData.referenceId = newReference.id
      hasUpdate = true
    }

    if (!hasUpdate) {
      throw createError({ statusCode: 400, statusMessage: 'At least one field to update is required' })
    }

    // Check existence
    const existing = await db.select({ id: schema.quotes.id })
      .from(schema.quotes)
      .where(inArray(schema.quotes.id, quoteIds))
      .all()

    if (existing.length !== quoteIds.length) {
      throw createError({ statusCode: 400, statusMessage: 'Some quotes not found' })
    }

    // Batch update
    updateData.updatedAt = new Date()
    await db.update(schema.quotes)
      .set(updateData as any)
      .where(inArray(schema.quotes.id, quoteIds))
      .run()

    return {
      success: true,
      data: {
        processed_count: quoteIds.length,
        quote_ids: quoteIds
      },
      message: `${quoteIds.length} quote${quoteIds.length > 1 ? 's' : ''} updated`
    }
  } catch (error: any) {
    if ((error as any).statusCode) {
      throw error
    }
    console.error('Bulk edit quotes error:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to update quotes' })
  }
})
