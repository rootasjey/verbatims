import { db, schema } from 'hub:db'
import { sql, eq, getTableColumns } from 'drizzle-orm'
import { normalizeAdminAuthor } from '~~/server/utils/admin-author-transformer'

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireModerator(event)

    const authorId = getRouterParam(event, 'id')!
    if (!authorId || isNaN(parseInt(authorId))) {
      throwServer(400, 'Invalid author ID')
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
      throwServer(404, 'Author not found')
    }

    return { success: true, data: normalizeAdminAuthor(authorResult as any) }
  } catch (error: any) {
    if ((error as any).statusCode) throw error
    console.error('Error fetching admin author details:', error)
    throwServer(500, 'Failed to fetch author')
  }
})
