import { db, schema } from 'hub:db'
import { eq, desc, count, sql, getTableColumns } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireAuth(event)
    const query = getQuery(event)
    const limit = Math.min(parseInt(query.limit as string) || 10, 50)
    const page = parseInt(query.page as string) || 1
    const offset = (page - 1) * limit
    
    // Get user's collections with quote count
    const collections = await db.select({
      ...getTableColumns(schema.userCollections),
      // Keep a text projection alongside the legacy timestamp-mode columns:
      // SQLite stores CURRENT_TIMESTAMP defaults as text in this database.
      createdAtText: sql<string | null>`${schema.userCollections.createdAt}`,
      updatedAtText: sql<string | null>`${schema.userCollections.updatedAt}`,
      quotes_count: sql<number>`COUNT(${schema.collectionQuotes.quoteId})`
    })
      .from(schema.userCollections)
      .leftJoin(schema.collectionQuotes, eq(schema.userCollections.id, schema.collectionQuotes.collectionId))
      .where(eq(schema.userCollections.userId, user.id))
      .groupBy(schema.userCollections.id)
      .orderBy(desc(schema.userCollections.updatedAt))
      .limit(limit)
      .offset(offset)
    
    const formattedCollections = collections.map(({ createdAtText, updatedAtText, ...collection }) => ({
      ...collection,
      createdAt: createdAtText,
      updatedAt: updatedAtText,
    }))

    // Get total count
    const totalResult = await db.select({ total: count() })
      .from(schema.userCollections)
      .where(eq(schema.userCollections.userId, user.id))

    const total = Number(totalResult[0]?.total) ?? 0
    const collectionCount = Number(formattedCollections.length) ?? 0
    const hasMore = offset + collectionCount < total

    return {
      success: true,
      data: { results: formattedCollections },
      pagination: {
        page,
        limit,
        total,
        hasMore,
        totalPages: Math.ceil(total / limit)
      }
    }
  } catch (error: any) {
    if ((error as any).statusCode) {
      throw error
    }
    
    console.error('Dashboard collections error:', error)
    throwServer(500, 'Failed to fetch collections')
  }
})
