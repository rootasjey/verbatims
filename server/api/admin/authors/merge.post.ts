import { db, schema } from 'hub:db'
import { sql, eq, and } from 'drizzle-orm'

const MERGEABLE_FIELDS = ['job', 'description', 'birthDate', 'birthLocation', 'deathDate', 'deathLocation', 'imageUrl', 'isFictional'] as const

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireUserSession(event)
    if (!user || user.role !== 'admin') {
      throwServer(403, 'Admin access required')
    }

    const body = await readBody(event)
    const sourceId = parseInt(body?.source_id)
    const targetId = parseInt(body?.target_id)
    const fieldsToCopy: string[] = body?.fields ?? []

    if (!sourceId || isNaN(sourceId) || !targetId || isNaN(targetId)) {
      throwServer(400, 'source_id and target_id are required')
    }

    if (sourceId === targetId) {
      throwServer(400, 'Source and target must be different authors')
    }

    const invalidFields = fieldsToCopy.filter(f => !MERGEABLE_FIELDS.includes(f as any))
    if (invalidFields.length > 0) {
      throwServer(400, `Invalid fields: ${invalidFields.join(', ')}`)
    }

    const [sourceAuthor, targetAuthor] = await Promise.all([
      db.select().from(schema.authors).where(eq(schema.authors.id, sourceId)).get(),
      db.select().from(schema.authors).where(eq(schema.authors.id, targetId)).get(),
    ])

    if (!sourceAuthor) throwServer(404, 'Source author not found')
    if (!targetAuthor) throwServer(404, 'Target author not found')

    const quotesResult = await db.get<{ count: number }>(sql`
      SELECT COUNT(*) as count FROM ${schema.quotes} WHERE author_id = ${sourceId}
    `)
    const quotesCount = quotesResult?.count || 0

    await db.run(sql`BEGIN TRANSACTION`)
    try {
      await db.update(schema.quotes)
        .set({ authorId: targetId })
        .where(eq(schema.quotes.authorId, sourceId))
        .run()

      await db.update(schema.authorViews)
        .set({ authorId: targetId })
        .where(eq(schema.authorViews.authorId, sourceId))
        .run()

      await db.update(schema.userLikes)
        .set({ likeableId: targetId })
        .where(and(
          eq(schema.userLikes.likeableType, 'author'),
          eq(schema.userLikes.likeableId, sourceId),
        ))
        .run()

      if (fieldsToCopy.length > 0) {
        const updateData: Record<string, any> = {}
        for (const field of fieldsToCopy) {
          if (sourceAuthor![field as keyof typeof sourceAuthor] != null && targetAuthor![field as keyof typeof targetAuthor] == null) {
            updateData[field] = sourceAuthor![field as keyof typeof sourceAuthor]
          }
        }
        if (Object.keys(updateData).length > 0) {
          await db.update(schema.authors)
            .set(updateData)
            .where(eq(schema.authors.id, targetId))
            .run()
        }
      }

      const viewsResult = await db.get<{ count: number }>(sql`
        SELECT COUNT(*) as count FROM ${schema.authorViews} WHERE author_id = ${sourceId}
      `)
      const viewsCount = viewsResult?.count || 0

      await db.update(schema.authors)
        .set({
          viewsCount: (targetAuthor!.viewsCount ?? 0) + (sourceAuthor!.viewsCount ?? 0),
          likesCount: (targetAuthor!.likesCount ?? 0) + (sourceAuthor!.likesCount ?? 0),
          sharesCount: (targetAuthor!.sharesCount ?? 0) + (sourceAuthor!.sharesCount ?? 0),
        })
        .where(eq(schema.authors.id, targetId))
        .run()

      await db.delete(schema.authors)
        .where(eq(schema.authors.id, sourceId))
        .run()

      await db.run(sql`COMMIT`)

      return {
        success: true,
        message: 'Authors merged successfully',
        data: {
          sourceAuthor: { id: sourceId, name: sourceAuthor!.name },
          targetAuthor: { id: targetId, name: targetAuthor!.name },
          quotesMoved: quotesCount,
          viewsMoved: viewsCount,
          fieldsCopied: fieldsToCopy,
        },
      }
    } catch (txErr) {
      await db.run(sql`ROLLBACK`)
      throwServer(500, 'Failed to merge authors')
    }
  } catch (error: any) {
    if ((error as any).statusCode) throw error
    console.error('Error merging authors:', error)
    throwServer(500, 'Internal server error')
  }
})
