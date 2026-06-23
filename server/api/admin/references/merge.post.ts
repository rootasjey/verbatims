import { db, schema } from 'hub:db'
import { sql, eq, and } from 'drizzle-orm'

const MERGEABLE_FIELDS = ['name', 'description', 'releaseDate', 'imageUrl', 'secondaryType', 'originalLanguage', 'primaryType'] as const

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireUserSession(event)
    if (!user || user.role !== 'admin') {
      throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
    }

    const body = await readBody(event)
    const sourceId = parseInt(body?.source_id)
    const targetId = parseInt(body?.target_id)
    const fieldsToCopy: string[] = body?.fields ?? []

    if (!sourceId || isNaN(sourceId) || !targetId || isNaN(targetId)) {
      throw createError({ statusCode: 400, statusMessage: 'source_id and target_id are required' })
    }

    if (sourceId === targetId) {
      throw createError({ statusCode: 400, statusMessage: 'Source and target must be different references' })
    }

    const invalidFields = fieldsToCopy.filter(f => !MERGEABLE_FIELDS.includes(f as any))
    if (invalidFields.length > 0) {
      throw createError({ statusCode: 400, statusMessage: `Invalid fields: ${invalidFields.join(', ')}` })
    }

    const [sourceRef, targetRef] = await Promise.all([
      db.select().from(schema.quoteReferences).where(eq(schema.quoteReferences.id, sourceId)).get(),
      db.select().from(schema.quoteReferences).where(eq(schema.quoteReferences.id, targetId)).get(),
    ])

    if (!sourceRef) {
      throw createError({ statusCode: 404, statusMessage: 'Source reference not found' })
    }
    if (!targetRef) {
      throw createError({ statusCode: 404, statusMessage: 'Target reference not found' })
    }

    const quotesResult = await db.get<{ count: number }>(sql`
      SELECT COUNT(*) as count FROM ${schema.quotes} WHERE reference_id = ${sourceId}
    `)
    const quotesCount = quotesResult?.count || 0

    await db.run(sql`BEGIN TRANSACTION`)
    try {
      await db.update(schema.quotes)
        .set({ referenceId: targetId })
        .where(eq(schema.quotes.referenceId, sourceId))
        .run()

      await db.update(schema.referenceViews)
        .set({ referenceId: targetId })
        .where(eq(schema.referenceViews.referenceId, sourceId))
        .run()

      await db.update(schema.userLikes)
        .set({ likeableId: targetId })
        .where(and(
          eq(schema.userLikes.likeableType, 'reference'),
          eq(schema.userLikes.likeableId, sourceId),
        ))
        .run()

      await db.update(schema.entityEnrichmentJobs)
        .set({ entityId: targetId })
        .where(and(
          eq(schema.entityEnrichmentJobs.entityType, 'reference'),
          eq(schema.entityEnrichmentJobs.entityId, sourceId),
        ))
        .run()

      await db.update(schema.entityEnrichmentFieldProposals)
        .set({ entityId: targetId })
        .where(and(
          eq(schema.entityEnrichmentFieldProposals.entityType, 'reference'),
          eq(schema.entityEnrichmentFieldProposals.entityId, sourceId),
        ))
        .run()

      await db.update(schema.entityFieldChangeHistory)
        .set({ entityId: targetId })
        .where(and(
          eq(schema.entityFieldChangeHistory.entityType, 'reference'),
          eq(schema.entityFieldChangeHistory.entityId, sourceId),
        ))
        .run()

      if (fieldsToCopy.length > 0) {
        const updateData: Record<string, any> = {}
        for (const field of fieldsToCopy) {
          if (sourceRef[field as keyof typeof sourceRef] != null && targetRef[field as keyof typeof targetRef] == null) {
            updateData[field] = sourceRef[field as keyof typeof sourceRef]
          }
        }
        if (Object.keys(updateData).length > 0) {
          await db.update(schema.quoteReferences)
            .set(updateData)
            .where(eq(schema.quoteReferences.id, targetId))
            .run()
        }
      }

      const viewsResult = await db.get<{ count: number }>(sql`
        SELECT COUNT(*) as count FROM ${schema.referenceViews} WHERE reference_id = ${sourceId}
      `)
      const viewsCount = viewsResult?.count || 0

      await db.update(schema.quoteReferences)
        .set({
          viewsCount: (targetRef.viewsCount ?? 0) + (sourceRef.viewsCount ?? 0),
          likesCount: (targetRef.likesCount ?? 0) + (sourceRef.likesCount ?? 0),
          sharesCount: (targetRef.sharesCount ?? 0) + (sourceRef.sharesCount ?? 0),
        })
        .where(eq(schema.quoteReferences.id, targetId))
        .run()

      await db.delete(schema.quoteReferences)
        .where(eq(schema.quoteReferences.id, sourceId))
        .run()

      await db.run(sql`COMMIT`)

      return {
        success: true,
        message: 'References merged successfully',
        data: {
          sourceReference: { id: sourceId, name: sourceRef.name },
          targetReference: { id: targetId, name: targetRef.name },
          quotesMoved: quotesCount,
          viewsMoved: viewsCount,
          fieldsCopied: fieldsToCopy,
        },
      }
    } catch (txErr) {
      await db.run(sql`ROLLBACK`)
      throw createError({ statusCode: 500, statusMessage: 'Failed to merge references' })
    }
  } catch (error: any) {
    if ((error as any).statusCode) throw error
    console.error('Error merging references:', error)
    throw createError({ statusCode: 500, statusMessage: 'Internal server error' })
  }
})
