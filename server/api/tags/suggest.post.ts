import { db, schema } from 'hub:db'
import { eq, sql } from 'drizzle-orm'
import { ensureCuratedTagsExist, getCuratedTagNames, matchCuratedTagsForQuote } from '~~/server/utils/tagging'

interface SuggestTagRow {
  id: number
  name: string
  color: string | null
  quotes_count: number | string | null
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)

    const quoteText = typeof body?.quoteText === 'string' ? body.quoteText : ''
    const quoteId = Number.isInteger(body?.quoteId) ? Number(body.quoteId) : null
    const requestedLimit = Number(body?.limit)
    const limit = Number.isFinite(requestedLimit)
      ? Math.max(1, Math.min(Math.trunc(requestedLimit), 10))
      : 5

    await ensureCuratedTagsExist()

    const curatedNames = getCuratedTagNames()
    const matchedTagNames = matchCuratedTagsForQuote(quoteText)
    const matchedSet = new Set(matchedTagNames.map(name => name.toLowerCase()))

    const curatedNameValues = curatedNames.map(name => name.toLowerCase())
    const rows = await db.all<SuggestTagRow>(sql`
      SELECT
        t.id,
        t.name,
        t.color,
        COUNT(qt.quote_id) as quotes_count
      FROM ${schema.tags} t
      LEFT JOIN ${schema.quoteTags} qt ON t.id = qt.tag_id
      LEFT JOIN ${schema.quotes} q ON qt.quote_id = q.id AND q.status = 'approved'
      WHERE LOWER(t.name) IN (${sql.join(curatedNameValues.map(name => sql`${name}`), sql`, `)})
      GROUP BY t.id
      ORDER BY quotes_count DESC, t.name ASC
    `)

    const existingTagIds = new Set<number>()
    if (quoteId && quoteId > 0) {
      const attached = await db.select({ tagId: schema.quoteTags.tagId })
        .from(schema.quoteTags)
        .where(eq(schema.quoteTags.quoteId, quoteId))
        .all()

      for (const relation of attached) {
        if (typeof relation.tagId === 'number') existingTagIds.add(relation.tagId)
      }
    }

    const suggestions = rows
      .map((row) => {
        const lowerName = String(row.name || '').toLowerCase()
        const quotesCount = Number(row.quotes_count || 0)
        const matched = matchedSet.has(lowerName)
        const score = (matched ? 1000 : 0) + quotesCount

        return {
          id: row.id,
          name: row.name,
          color: row.color || '#687FE5',
          quotesCount,
          score,
          reason: matched ? 'keyword' : 'popular'
        }
      })
      .filter(tag => !existingTagIds.has(tag.id))
      .sort((a, b) => b.score - a.score || b.quotesCount - a.quotesCount || a.name.localeCompare(b.name))
      .slice(0, limit)

    return {
      success: true,
      data: suggestions,
      meta: {
        matched: matchedTagNames,
        usedCuratedPool: true,
        limit
      }
    }
  } catch (error) {
    console.error('Error suggesting tags:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to suggest tags'
    })
  }
})
