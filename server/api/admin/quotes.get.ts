import { db, schema } from 'hub:db'
import { sql } from 'drizzle-orm'
import type { DatabaseAdminQuote } from "~/types"
import { transformAdminQuotes } from '~/server/utils/quote-transformer'

export default defineEventHandler(async (event) => {
  try {
    const session = await requireUserSession(event)
    if (!session.user) throwServer(401, 'Authentication required')
    if (session.user.role !== 'admin' && session.user.role !== 'moderator') throwServer(403, 'Admin or moderator access required')
    
    const query = getQuery(event)
    const page = parseInt(query.page as string) || 1
    const limit = Math.min(parseInt(query.limit as string) || 20, 50)
    const offset = (page - 1) * limit
    const search = query.search as string || ''
    const status = query.status as string || 'approved'
    const language = query.language as string
    
    // Build WHERE conditions for SQL
    const conditions = ['q.status = ' + sql.raw(`'${status}'`)]
    
    if (search) {
      const searchPattern = `%${search}%`
      conditions.push(`(q.name LIKE ${sql.raw(`'${searchPattern}'`)} OR a.name LIKE ${sql.raw(`'${searchPattern}'`)} OR r.name LIKE ${sql.raw(`'${searchPattern}'`)} OR u.name LIKE ${sql.raw(`'${searchPattern}'`)})`)
    }
    
    if (language) {
      conditions.push(`q.language = ${sql.raw(`'${language}'`)}`)
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    
    const quotesResult = await db.all<DatabaseAdminQuote>(sql.raw(`
      SELECT
        q.*,
        a.name as author_name,
        a.is_fictional as author_is_fictional,
        a.image_url as author_image_url,
        r.name as reference_name,
        r.primary_type as reference_type,
        u.name as user_name,
        u.email as user_email,
        u.avatar_url as user_avatar,
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
      ORDER BY q.moderated_at DESC, q.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `))

    // Get total count
    const totalResult = await db.get<{ total: number }>(sql.raw(`
      SELECT COUNT(*) as total
      FROM ${schema.quotes._.name} q
      LEFT JOIN ${schema.authors._.name} a ON q.author_id = a.id
      LEFT JOIN ${schema.quoteReferences._.name} r ON q.reference_id = r.id
      LEFT JOIN ${schema.users._.name} u ON q.user_id = u.id
      ${whereClause}
    `))

    const total = totalResult?.total || 0
    const hasMore = offset + quotesResult.length < total
    const processedQuotes = transformAdminQuotes(quotesResult)
    
    return {
      success: true,
      data: processedQuotes,
      pagination: {
        page,
        limit,
        total,
        hasMore,
        totalPages: Math.ceil(total / limit)
      }
    }
  } catch (error: any) {
    if ((error as any).statusCode) throw error
    console.error('Admin quotes error:', error)
    throwServer(500, 'Failed to fetch quotes')
  }
})
