import { getHarvestAdapter } from '../../../utils/harvest/index'
import { db, schema } from 'hub:db'
import { sql, or } from 'drizzle-orm'
import { isHarvestSourceType } from '#shared/constants/harvest'
import type { HarvestSourceType } from '#shared/constants/harvest'
import type { HarvestQuotePreview } from '#shared/types/harvest'

export default defineEventHandler(async (event) => {
  const { user } = await requireAuth(event)
  if (user?.role !== 'admin' && user?.role !== 'moderator') {
    throwServer(403, 'Admin or moderator access required')
  }

  const query = getQuery(event)
  const sourceType = String(query.sourceType || '') as HarvestSourceType
  const pageSlug = String(query.pageSlug || '')

  if (!isHarvestSourceType(sourceType)) {
    throwServer(400, `Invalid source type: ${sourceType}`)
  }

  if (!pageSlug) {
    throwServer(400, 'pageSlug query parameter is required')
  }

  const adapter = getHarvestAdapter(sourceType)
  const quotes = await adapter.getPageQuotes(pageSlug)

  if (quotes.length === 0) {
    return { success: true, data: [] }
  }

  const normalizedTexts = quotes.map(q => q.text.trim().toLowerCase())

  const batchSize = 30
  const duplicateMap = new Map<string, number>()

  for (let i = 0; i < normalizedTexts.length; i += batchSize) {
    const batch = normalizedTexts.slice(i, i + batchSize)

    const conditions = batch.map(t =>
      sql`LOWER(TRIM(${schema.quotes.name})) = ${t}`
    )

    const whereClause = conditions.length === 1
      ? conditions[0]
      : or(...conditions)!

    const rows = await db.select({
      id: schema.quotes.id,
      name: schema.quotes.name,
    })
      .from(schema.quotes)
      .where(whereClause)

    for (const row of rows) {
      const key = (row.name || '').trim().toLowerCase()
      duplicateMap.set(key, row.id)
    }
  }

  const enrichedQuotes: HarvestQuotePreview[] = quotes.map((q) => {
    const key = q.text.trim().toLowerCase()
    const isDuplicate = duplicateMap.has(key)
    const duplicateQuoteId = duplicateMap.get(key)

    return {
      ...q,
      isDuplicate,
      duplicateQuoteId,
    }
  })

  return { success: true, data: enrichedQuotes }
})