import type { transformQuotes } from '~/types''~/server/utils/quote-transformer'
import type { DatabaseQuoteWithRelations } from '~/types'

export default defineEventHandler(async (event) => {
  try {
    const db = hubDatabase()
    const { count, language, status } = getQuery(event)

    // Default to approved quotes unless explicitly requested
    const quoStatus = typeof status === 'string' && status.length ? status : 'approved'

    let n = parseInt(count as string, 10)
    if (isNaN(n) || n < 1) n = 12
    if (n > 100) n = 100

    const whereParts: string[] = ['q.status = ?']
    const params: any[] = [quoStatus]

    if (typeof language === 'string' && language.length) {
      whereParts.push('q.language = ?')
      params.push(language)
    }

    const whereClause = whereParts.join(' AND ')

    const randomQuery = `
      SELECT
        q.*,
        a.name as author_name,
        a.is_fictional as author_is_fictional,
        r.name as reference_name,
        r.primary_type as reference_type,
        u.name as user_name,
        GROUP_CONCAT(t.name) as tag_names,
        GROUP_CONCAT(t.color) as tag_colors
      FROM quotes q
      LEFT JOIN authors a ON q.author_id = a.id
      LEFT JOIN quote_references r ON q.reference_id = r.id
      LEFT JOIN users u ON q.user_id = u.id
      LEFT JOIN quote_tags qt ON q.id = qt.quote_id
      LEFT JOIN tags t ON qt.tag_id = t.id
      WHERE ${whereClause}
      GROUP BY q.id
      ORDER BY RANDOM()
      LIMIT ?
    `

    const result = await db.prepare(randomQuery).bind(...params, n).all()
    const quotes = (result.results || []) as unknown as DatabaseQuoteWithRelations[]
    const transformed = transformQuotes(quotes)

    return {
      success: true,
      data: transformed
    }
  }
  catch (err) {
    console.error('Error fetching random quotes:', err)
    throwServer(500, 'Failed to fetch random quotes')
  }
})
