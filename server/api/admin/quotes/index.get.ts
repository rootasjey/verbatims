import { db, schema } from 'hub:db'
import { sql } from 'drizzle-orm'
import type { DatabaseAdminQuote } from '~/types'
import { transformAdminQuotes } from '~/server/utils/quote-transformer'

export default defineEventHandler(async (event) => {
  try {
    // Auth: admin or moderator
    const session = await getUserSession(event)
    if (!session.user) {
      throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
    }
    if (session.user.role !== 'admin' && session.user.role !== 'moderator') {
      throw createError({ statusCode: 403, statusMessage: 'Admin or moderator access required' })
    }

    const query = getQuery(event)

    const page = Math.max(parseInt(query.page as string) || 1, 1)
    const limit = Math.min(parseInt(query.limit as string) || 20, 100)
    const offset = (page - 1) * limit

    const status = (query.status as string) || 'approved'
    const language = (query.language as string) || ''
    const search = (query.search as string) || ''

    // WHERE conditions
    const conditions: string[] = [`q.status = ${sql.raw(`'${status}'`)}`]

    if (language) {
      conditions.push(`q.language = ${sql.raw(`'${language}'`)}`)
    }

    if (search) {
      const like = `%${search}%`
      conditions.push(`(q.name LIKE ${sql.raw(`'${like}'`)} OR a.name LIKE ${sql.raw(`'${like}'`)} OR r.name LIKE ${sql.raw(`'${like}'`)} OR u.name LIKE ${sql.raw(`'${like}'`)})`)
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`

    // Main query with joins for admin view
    const quotes = await db.all<DatabaseAdminQuote>(sql.raw(`
      SELECT
        q.*,
        a.name as author_name,
        a.is_fictional as author_is_fictional,
        a.image_url as author_image_url,
        r.name as reference_name,
        r.primary_type as reference_type,
        u.name as user_name,
        u.email as user_email,
        u.avatar_url as user_avatar_url,
        m.name as moderator_name,
        GROUP_CONCAT(t.name) as tag_names,
        GROUP_CONCAT(t.color) as tag_colors
      FROM ${schema.quotes._.name} q
      LEFT JOIN ${schema.authors._.name} a ON q.author_id = a.id
      LEFT JOIN ${schema.quoteReferences._.name} r ON q.reference_id = r.id
      LEFT JOIN ${schema.users._.name} u ON q.user_id = u.id
      LEFT JOIN ${schema.users._.name} m ON q.moderator_id = m.id
      LEFT JOIN ${schema.quoteTags._.name} qt ON q.id = qt.quote_id
      LEFT JOIN ${schema.tags._.name} t ON qt.tag_id = t.id
      ${whereClause}
      GROUP BY q.id
      ORDER BY q.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `))

    // Count query
    const totalRow = await db.get<{ total: number }>(sql.raw(`
      SELECT COUNT(DISTINCT q.id) as total
      FROM ${schema.quotes._.name} q
      LEFT JOIN ${schema.authors._.name} a ON q.author_id = a.id
      LEFT JOIN ${schema.quoteReferences._.name} r ON q.reference_id = r.id
      LEFT JOIN ${schema.users._.name} u ON q.user_id = u.id
      ${whereClause}
    `))

    const total = totalRow?.total || 0
    const totalPages = Math.ceil(total / limit)
    const hasMore = page < totalPages

    const data = transformAdminQuotes(quotes)

    return {
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore
      }
    }
  } catch (error: any) {
    if ((error as any).statusCode) {
      throw error
    }
    console.error('Admin quotes index error:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch admin quotes' })
  }
})
