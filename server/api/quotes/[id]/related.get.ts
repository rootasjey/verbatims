import { db, schema } from 'hub:db'
import { eq, and, ne, inArray, notInArray, desc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const quoteId = getRouterParam(event, 'id')
    if (!quoteId || isNaN(parseInt(quoteId))) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid quote ID'
      })
    }
    const quoteIdNum = parseInt(quoteId)

    // First, get the current quote's details to find related quotes
    const currentQuote = await db.select({ 
      authorId: schema.quotes.authorId, 
      referenceId: schema.quotes.referenceId 
    })
      .from(schema.quotes)
      .where(and(
        eq(schema.quotes.id, quoteIdNum),
        eq(schema.quotes.status, 'approved')
      ))
      .get()

    if (!currentQuote) {
      return {
        success: true,
        data: []
      }
    }

    // Find related quotes based on:
    // 1. Same author (highest priority)
    // 2. Same reference
    // 3. Similar tags
    let relatedQuotes: any[] = []

    // Get quotes by same author
    if (currentQuote.authorId) {
      const authorQuotes = await db.select({
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
        referenceType: schema.quoteReferences.primaryType,
        userName: schema.users.name
      })
      .from(schema.quotes)
      .leftJoin(schema.authors, eq(schema.quotes.authorId, schema.authors.id))
      .leftJoin(schema.quoteReferences, eq(schema.quotes.referenceId, schema.quoteReferences.id))
      .leftJoin(schema.users, eq(schema.quotes.userId, schema.users.id))
      .where(and(
        eq(schema.quotes.authorId, currentQuote.authorId),
        ne(schema.quotes.id, quoteIdNum),
        eq(schema.quotes.status, 'approved')
      ))
      .orderBy(desc(schema.quotes.likesCount), desc(schema.quotes.viewsCount))
      .limit(3)
      .all()

      if (authorQuotes) {
        relatedQuotes.push(...authorQuotes)
      }
    }

    // Get quotes from same reference if we need more
    if (relatedQuotes.length < 4 && currentQuote.referenceId) {
      const referenceQuotes = await db.select({
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
        referenceType: schema.quoteReferences.primaryType,
        userName: schema.users.name
      })
      .from(schema.quotes)
      .leftJoin(schema.authors, eq(schema.quotes.authorId, schema.authors.id))
      .leftJoin(schema.quoteReferences, eq(schema.quotes.referenceId, schema.quoteReferences.id))
      .leftJoin(schema.users, eq(schema.quotes.userId, schema.users.id))
      .where(and(
        eq(schema.quotes.referenceId, currentQuote.referenceId),
        ne(schema.quotes.id, quoteIdNum),
        eq(schema.quotes.status, 'approved')
      ))
      .orderBy(desc(schema.quotes.likesCount), desc(schema.quotes.viewsCount))
      .limit(4 - relatedQuotes.length)
      .all()

      // Filter out duplicates
      if (referenceQuotes) {
        const existingIds = new Set(relatedQuotes.map((q: any) => q.id))
        const newQuotes = referenceQuotes.filter((q: any) => !existingIds.has(q.id))
        relatedQuotes.push(...newQuotes)
      }
    }

    // If we still need more, get popular quotes with similar tags
    if (relatedQuotes.length < 4) {
      // Get tag IDs for current quote
      const currentQuoteTags = await db.select({ tagId: schema.quoteTags.tagId })
        .from(schema.quoteTags)
        .where(eq(schema.quoteTags.quoteId, quoteIdNum))
        .all()

      const tagIds = currentQuoteTags.map(t => t.tagId)

      if (tagIds.length > 0) {
        const existingIds = [...new Set(relatedQuotes.map((q: any) => q.id))]

        const tagQueryConditions = [
          inArray(schema.quoteTags.tagId, tagIds),
          ne(schema.quotes.id, quoteIdNum),
          eq(schema.quotes.status, 'approved')
        ]

        if (existingIds.length > 0) {
          tagQueryConditions.push(notInArray(schema.quotes.id, existingIds))
        }

        const tagQuotes = await db.selectDistinct({
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
          referenceType: schema.quoteReferences.primaryType,
          userName: schema.users.name
        })
          .from(schema.quotes)
          .innerJoin(schema.quoteTags, eq(schema.quoteTags.quoteId, schema.quotes.id))
          .leftJoin(schema.authors, eq(schema.quotes.authorId, schema.authors.id))
          .leftJoin(schema.quoteReferences, eq(schema.quotes.referenceId, schema.quoteReferences.id))
          .leftJoin(schema.users, eq(schema.quotes.userId, schema.users.id))
          .where(and(...tagQueryConditions))
          .orderBy(desc(schema.quotes.likesCount), desc(schema.quotes.viewsCount))
          .limit(4 - relatedQuotes.length)
          .all()

        if (tagQuotes) {
          relatedQuotes.push(...tagQuotes)
        }
      }
    }

    // Fetch tags for all related quotes
    const quoteIds = relatedQuotes.map((q: any) => q.id)
    let tagsByQuoteId: Record<number, any[]> = {}

    if (quoteIds.length > 0) {
      const allTags = await db.select({
        quoteId: schema.quoteTags.quoteId,
        name: schema.tags.name,
        color: schema.tags.color
      })
      .from(schema.quoteTags)
      .innerJoin(schema.tags, eq(schema.quoteTags.tagId, schema.tags.id))
      .where(inArray(schema.quoteTags.quoteId, quoteIds))
      .all()

      // Group tags by quote ID
      allTags.forEach(tag => {
        if (!tagsByQuoteId[tag.quoteId]) {
          tagsByQuoteId[tag.quoteId] = []
        }
        tagsByQuoteId[tag.quoteId].push({ name: tag.name, color: tag.color })
      })
    }

    // Transform the results
    const transformedQuotes = relatedQuotes.slice(0, 4).map((quote: any) => ({
      id: quote.id,
      name: quote.name,
      language: quote.language,
      status: quote.status,
      views_count: quote.viewsCount,
      likes_count: quote.likesCount,
      shares_count: quote.sharesCount,
      is_featured: quote.isFeatured,
      created_at: quote.createdAt,
      updated_at: quote.updatedAt,
      author: quote.authorId ? {
        id: quote.authorId,
        name: quote.authorName,
        is_fictional: quote.authorIsFictional
      } : null,
      reference: quote.referenceId ? {
        id: quote.referenceId,
        name: quote.referenceName,
        type: quote.referenceType
      } : null,
      user: {
        name: quote.userName
      },
      tags: tagsByQuoteId[quote.id] || []
    }))

    return {
      success: true,
      data: transformedQuotes
    }
  } catch (error) {
    console.error('Error fetching related quotes:', error)
    return {
      success: true,
      data: []
    }
  }
})
