import { db, schema } from 'hub:db'
import { sql, eq, getTableColumns } from 'drizzle-orm'

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

    const authorResult = await db.select({
      ...getTableColumns(schema.authors),
      quotes_count: sql<number>`COUNT(${schema.quotes.id})`
    })
      .from(schema.authors)
      .leftJoin(schema.quotes, eq(schema.authors.id, schema.quotes.authorId))
      .where(eq(schema.authors.id, parseInt(authorId)))
      .groupBy(schema.authors.id)
      .get()

    if (!authorResult) {
      throw createError({ statusCode: 404, statusMessage: 'Author not found' })
    }

    return { success: true, data: authorResult }
  } catch (error: any) {
    if ((error as any).statusCode) throw error
    console.error('Error fetching admin author details:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch author' })
  }
})
