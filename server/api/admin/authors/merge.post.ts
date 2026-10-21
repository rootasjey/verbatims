import { db, schema } from 'hub:db'
import { sql, eq, and } from 'drizzle-orm'

const MERGEABLE_FIELDS = ['job', 'description', 'birthDate', 'birthYear', 'birthEra', 'birthMonth', 'birthDay', 'birthIsApproximate', 'birthCalendar', 'birthLocation', 'deathDate', 'deathYear', 'deathEra', 'deathMonth', 'deathDay', 'deathIsApproximate', 'deathCalendar', 'deathLocation', 'imageUrl', 'isFictional'] as const

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireAuth(event)
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
      SELECT COUNT(DISTINCT quote_id) as count FROM ${schema.quoteAttributions} WHERE author_id = ${sourceId}
    `)
    const quotesCount = quotesResult?.count || 0

    const viewsResult = await db.get<{ count: number }>(sql`
      SELECT COUNT(*) as count FROM ${schema.authorViews} WHERE author_id = ${sourceId}
    `)
    const viewsCount = viewsResult?.count || 0
    const statements: any[] = [
      db.update(schema.quoteAttributions)
        .set({ authorId: targetId })
        .where(eq(schema.quoteAttributions.authorId, sourceId)),
      db.update(schema.authorViews)
        .set({ authorId: targetId })
        .where(eq(schema.authorViews.authorId, sourceId)),
      db.update(schema.userLikes)
        .set({ likeableId: targetId })
        .where(and(
          eq(schema.userLikes.likeableType, 'author'),
          eq(schema.userLikes.likeableId, sourceId),
        )),
    ]

      if (fieldsToCopy.length > 0) {
        const updateData: Record<string, any> = {}
        for (const field of fieldsToCopy) {
          if (sourceAuthor![field as keyof typeof sourceAuthor] != null && targetAuthor![field as keyof typeof targetAuthor] == null) {
            updateData[field] = sourceAuthor![field as keyof typeof sourceAuthor]
          }
        }
        for (const prefix of ['birth', 'death'] as const) {
          const yearField = prefix === 'birth' ? 'birthYear' : 'deathYear'
          if (targetAuthor[yearField] == null && sourceAuthor[yearField] != null) {
            for (const field of prefix === 'birth'
              ? ['birthDate', 'birthYear', 'birthEra', 'birthMonth', 'birthDay', 'birthIsApproximate', 'birthCalendar'] as const
              : ['deathDate', 'deathYear', 'deathEra', 'deathMonth', 'deathDay', 'deathIsApproximate', 'deathCalendar'] as const) {
              updateData[field] = sourceAuthor[field]
            }
          }
        }
        if (Object.keys(updateData).length > 0) {
          statements.push(db.update(schema.authors)
            .set(updateData)
            .where(eq(schema.authors.id, targetId)))
        }
      }

      statements.push(db.update(schema.authors)
        .set({
          viewsCount: (targetAuthor!.viewsCount ?? 0) + (sourceAuthor!.viewsCount ?? 0),
          likesCount: (targetAuthor!.likesCount ?? 0) + (sourceAuthor!.likesCount ?? 0),
          sharesCount: (targetAuthor!.sharesCount ?? 0) + (sourceAuthor!.sharesCount ?? 0),
        })
        .where(eq(schema.authors.id, targetId)))
      statements.push(db.delete(schema.authors).where(eq(schema.authors.id, sourceId)))
      await db.batch(statements as any)

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
  } catch (error: any) {
    if ((error as any).statusCode) throw error
    console.error('Error merging authors:', error)
    throwServer(500, 'Internal server error')
  }
})
