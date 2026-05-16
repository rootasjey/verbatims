import { db, schema } from 'hub:db'
import { eq, sql, and, desc } from 'drizzle-orm'
import { transformAdminQuotes } from '~~/server/utils/quote-transformer'

export default defineEventHandler(async (event) => {
  const { user } = await getUserSession(event)
  if (!user) throwServer(401, 'Authentication required')
  if (user?.role !== 'admin' && user?.role !== 'moderator') {
    throwServer(403, 'Admin or moderator access required')
  }

  const query = getQuery(event)
  const page = Math.max(Number(query.page) || 1, 1)
  const limit = Math.min(Number(query.limit) || 50, 200)
  const offset = (page - 1) * limit
  const searchQuery = String(query.search || '').trim()
  const sourceType = String(query.sourceType || '').trim()

  const conditions = [eq(schema.quotes.status, 'harvested')]
  if (searchQuery) {
    conditions.push(sql`LOWER(${schema.quotes.name}) LIKE ${'%' + searchQuery.toLowerCase() + '%'}`)
  }
  if (sourceType) {
    conditions.push(eq(schema.quotes.sourceType, sourceType as any))
  }

  const where = and(...conditions)

  const [quotes, countResult] = await Promise.all([
    db.select()
      .from(schema.quotes)
      .leftJoin(schema.authors, eq(schema.quotes.authorId, schema.authors.id))
      .leftJoin(schema.quoteReferences, eq(schema.quotes.referenceId, schema.quoteReferences.id))
      .leftJoin(schema.users, eq(schema.quotes.userId, schema.users.id))
      .where(where)
      .orderBy(desc(schema.quotes.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ count: sql<number>`COUNT(*)` })
      .from(schema.quotes)
      .where(where),
  ])

  const total = Number(countResult[0]?.count) || 0
  const transformed = transformAdminQuotes(quotes as any[])

  return {
    success: true,
    data: transformed,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
})