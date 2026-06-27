import { db, schema } from 'hub:db'
import { eq, sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const limit = Math.min(parseInt(query.limit as string) || 1, 10)

  const quotes = await db
    .select({
      id: schema.quotes.id,
      name: schema.quotes.name,
      language: schema.quotes.language,
      authorId: schema.quotes.authorId,
      referenceId: schema.quotes.referenceId,
      authorName: schema.authors.name,
      authorIsFictional: schema.authors.isFictional,
      referenceName: schema.quoteReferences.name,
      referencePrimaryType: schema.quoteReferences.primaryType,
      createdAt: schema.quotes.createdAt,
    })
    .from(schema.quotes)
    .leftJoin(schema.authors, eq(schema.quotes.authorId, schema.authors.id))
    .leftJoin(schema.quoteReferences, eq(schema.quotes.referenceId, schema.quoteReferences.id))
    .where(eq(schema.quotes.status, 'approved'))
    .orderBy(sql`RANDOM()`)
    .limit(limit)
    .all()

  return {
    success: true,
    data: quotes.map(q => ({
      id: q.id,
      content: q.name,
      language: q.language,
      author: q.authorId ? { id: q.authorId, name: q.authorName, fictional: q.authorIsFictional } : null,
      reference: q.referenceId ? { id: q.referenceId, name: q.referenceName, type: q.referencePrimaryType } : null,
      created_at: q.createdAt,
    })),
  }
})
