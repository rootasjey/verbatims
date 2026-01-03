import { db, schema } from 'hub:db'
import { sql, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireUserSession(event)
    if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
      throw createError({ statusCode: 403, statusMessage: 'Admin or moderator access required' })
    }

    const authorId = getRouterParam(event, 'id')
    if (!authorId || isNaN(parseInt(authorId))) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid author ID' })
    }

    const author = await db.get(sql.raw(`
      SELECT 
        a.*,
        COUNT(q.id) as quotes_count
      FROM ${schema.authors._.name} a
      LEFT JOIN ${schema.quotes._.name} q ON a.id = q.author_id
      WHERE a.id = ${parseInt(authorId)}
      GROUP BY a.id
    `))

    if (!author) {
      throw createError({ statusCode: 404, statusMessage: 'Author not found' })
    }

    return { success: true, data: author }
  } catch (error: any) {
    if ((error as any).statusCode) throw error
    console.error('Error fetching admin author details:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch author' })
  }
})
