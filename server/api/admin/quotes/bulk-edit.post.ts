import { db, schema } from 'hub:db'
import { eq, inArray, sql } from 'drizzle-orm'
import { getQuoteProvenance, syncPrimaryAttribution } from '~~/server/utils/quote-provenance'

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireModerator(event)

    const body = await readBody(event)

    if (!body.quote_ids || !Array.isArray(body.quote_ids) || body.quote_ids.length === 0) {
      throwServer(400, 'Quote IDs array is required')
    }

    if (body.quote_ids.length > 50) {
      throwServer(400, 'Cannot edit more than 50 quotes at once')
    }

    let hasUpdate = false
    const updateData: Record<string, unknown> = {}
    let authorId: number | null | undefined
    let referenceId: number | null | undefined

    // Normalize and validate IDs
    const quoteIds: number[] = body.quote_ids.map((id: string | number) => {
      const numId = typeof id === 'number' ? id : parseInt(id)
      if (isNaN(numId)) {
        throwServer(400, 'All quote IDs must be valid numbers')
      }
      return numId
    })

    // Language update
    if (body.language !== undefined) {
      const validLanguages = ['en', 'fr', 'es', 'de', 'it', 'pt', 'ru', 'ja', 'zh', 'la']
      if (!validLanguages.includes(body.language)) {
        throwServer(400, `Invalid language: ${body.language}`)
      }
      updateData.language = body.language
      hasUpdate = true
    }

    // Author update
    if (body.author_id !== undefined) {
      authorId = body.author_id || null
      hasUpdate = true
    } else if (body.new_author && body.new_author.name) {
      const newAuthor = await db.insert(schema.authors).values({
        name: body.new_author.name.trim(),
        isFictional: body.new_author.is_fictional || false,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning({ id: schema.authors.id }).get()

      authorId = newAuthor.id
      hasUpdate = true
    }

    // Reference update
    if (body.reference_id !== undefined) {
      referenceId = body.reference_id || null
      hasUpdate = true
    } else if (body.new_reference && body.new_reference.name) {
      const newReference = await db.insert(schema.quoteReferences).values({
        name: body.new_reference.name.trim(),
        originalLanguage: body.new_reference.original_language || body.language || 'en',
        primaryType: body.new_reference.primary_type || 'other',
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning({ id: schema.quoteReferences.id }).get()

      referenceId = newReference.id
      hasUpdate = true
    }

    if (!hasUpdate) {
      throwServer(400, 'At least one field to update is required')
    }

    // Check existence
    const existing = await db.select({ id: schema.quotes.id })
      .from(schema.quotes)
      .where(inArray(schema.quotes.id, quoteIds))
      .all()

    if (existing.length !== quoteIds.length) {
      throwServer(400, 'Some quotes not found')
    }

    // Update quote metadata and primary attributions together. The fields on
    // `quotes` are legacy compatibility columns and must not be written here.
    updateData.updatedAt = new Date()
    const statements: any[] = [
      db.update(schema.quotes)
        .set(updateData as any)
        .where(inArray(schema.quotes.id, quoteIds)),
    ]

    if (authorId !== undefined || referenceId !== undefined) {
      const provenanceByQuote = await Promise.all(quoteIds.map(id => getQuoteProvenance(id)))
      for (const [index, provenance] of provenanceByQuote.entries()) {
        const primary = provenance.attributions.find(item => item.is_primary) ?? provenance.attributions[0]
        const nextAuthorId = authorId !== undefined ? authorId : primary?.author_id ?? null
        const nextReferenceId = referenceId !== undefined ? referenceId : primary?.reference_id ?? null
        if (nextAuthorId == null && nextReferenceId == null) {
          throwServer(400, 'A quote requires an author or reference')
        }
        statements.push(db.update(schema.quoteAttributions)
          .set({ authorId: nextAuthorId, referenceId: nextReferenceId, updatedAt: new Date() })
          .where(eq(schema.quoteAttributions.id, primary!.id)))
      }
    }
    await db.batch(statements as any)

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
    throwServer(500, 'Failed to update quotes')
  }
})
