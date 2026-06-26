import { db, schema } from 'hub:db'
import { desc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const { user } = await requireAuth(event)
  if (user?.role !== 'admin' && user?.role !== 'moderator') {
    throwServer(403, 'Admin or moderator access required')
  }

  const query = getQuery(event)
  const limit = Math.min(Number(query.limit) || 50, 200)

  const logs = await db.select()
    .from(schema.harvestLogs)
    .orderBy(desc(schema.harvestLogs.createdAt))
    .limit(limit)
    .execute()

  return {
    success: true,
    data: logs.map(log => ({
      id: log.id,
      sourceId: log.sourceId,
      sourceType: log.sourceType,
      sourcePageSlug: log.sourcePageSlug,
      sourcePageUrl: log.sourcePageUrl,
      status: log.status,
      quotesFound: log.quotesFound,
      quotesImported: log.quotesImported,
      quotesSkipped: log.quotesSkipped,
      authorsCreated: log.authorsCreated,
      referencesCreated: log.referencesCreated,
      errorMessage: log.errorMessage,
      startedAt: log.startedAt?.toISOString() || null,
      completedAt: log.completedAt?.toISOString() || null,
      createdAt: log.createdAt?.toISOString() || null,
    })),
  }
})