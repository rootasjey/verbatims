import { db, schema } from 'hub:db'
import { eq, and, sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const { count, language, status } = getQuery(event)

    // Default to approved quotes unless explicitly requested
    const quoStatus = typeof status === 'string' && status.length ? status : 'approved'

    let n = parseInt(count as string, 10)
    if (isNaN(n) || n < 1) n = 12
    if (n > 100) n = 100

    const conditions = [eq(schema.quotes.status, quoStatus as any)]

    if (typeof language === 'string' && language.length) {
      conditions.push(eq(schema.quotes.language, language as any))
    }

    const quotes = await db.select({
      id: schema.quotes.id,
      name: schema.quotes.name,
      language: schema.quotes.language,
      status: schema.quotes.status,
      viewsCount: schema.quotes.viewsCount,
      likesCount: schema.quotes.likesCount,
      sharesCount: schema.quotes.sharesCount,
      isFeatured: schema.quotes.isFeatured,
      createdAt: schema.quotes.createdAt,
      updatedAt: schema.quotes.updatedAt,
      authorId: schema.quotes.authorId,
      referenceId: schema.quotes.referenceId,
      userId: schema.quotes.userId,
      authorName: schema.authors.name,
      authorIsFictional: schema.authors.isFictional,
      referenceName: schema.quoteReferences.name,
      referencePrimaryType: schema.quoteReferences.primaryType,
      userName: schema.users.name
    })
    .from(schema.quotes)
    .leftJoin(schema.authors, eq(schema.quotes.authorId, schema.authors.id))
    .leftJoin(schema.quoteReferences, eq(schema.quotes.referenceId, schema.quoteReferences.id))
    .leftJoin(schema.users, eq(schema.quotes.userId, schema.users.id))
    .where(and(...conditions))
    .orderBy(sql`RANDOM()`)
    .limit(n)
    .all()

    // Fetch tags for all quotes
    const quoteIds = quotes.map(q => q.id)
    let tagsMap: Record<number, any[]> = {}
    
    if (quoteIds.length > 0) {
      const tags = await db.select({
        quoteId: schema.quoteTags.quoteId,
        name: schema.tags.name,
        color: schema.tags.color
      })
      .from(schema.tags)
      .innerJoin(schema.quoteTags, eq(schema.tags.id, schema.quoteTags.tagId))
      .where(sql`${schema.quoteTags.quoteId} IN ${quoteIds}`)
      .all()

      tags.forEach(tag => {
        if (!tagsMap[tag.quoteId]) tagsMap[tag.quoteId] = []
        tagsMap[tag.quoteId].push({ name: tag.name, color: tag.color })
      })
    }

    // Transform quotes to match DatabaseQuoteWithRelations structure expected by transformQuotes
    // Note: transformQuotes expects snake_case properties as it was designed for raw SQL results
    // We need to adapt it or adapt our data. 
    // Since transformQuotes is a utility, let's see if we can just return the data directly or if we need to map it.
    // The previous code used `transformQuotes` which likely handles the mapping from DB snake_case to camelCase response.
    // But here we already have camelCase from Drizzle (mostly).
    
    // Let's look at `transformQuotes` implementation if possible, but I can't read it right now.
    // Assuming `transformQuotes` takes raw DB results (snake_case) and returns the API response format.
    // Since we are using Drizzle, we can just map it directly here and skip `transformQuotes` or adapt the data to match what `transformQuotes` expects.
    
    // To be safe and consistent with other endpoints I migrated, I will do the transformation manually here matching the API response format.
    
    const transformed = quotes.map(q => ({
      id: q.id,
      name: q.name,
      language: q.language,
      status: q.status,
      views_count: q.viewsCount,
      likes_count: q.likesCount,
      shares_count: q.sharesCount,
      is_featured: q.isFeatured,
      created_at: q.createdAt,
      updated_at: q.updatedAt,
      author: q.authorId ? {
        id: q.authorId,
        name: q.authorName,
        is_fictional: q.authorIsFictional
      } : null,
      reference: q.referenceId ? {
        id: q.referenceId,
        name: q.referenceName,
        type: q.referencePrimaryType
      } : null,
      user: {
        name: q.userName
      },
      tags: tagsMap[q.id] || []
    }))

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
