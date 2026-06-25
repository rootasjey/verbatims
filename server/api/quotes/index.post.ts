import { db, schema } from 'hub:db'
import { eq, sql, and, ne } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireUserSession(event)

    const body = await readBody(event)

    if (!body.name || body.name.length < 2 || body.name.length > 4000) {
      throwServer(400, 'Quote text must be between 2 and 4000 characters')
    }

    let authorId = body.author_id
    let referenceId = body.reference_id

    // Create new author if provided
    if (body.new_author && body.new_author.name) {
      const authorResult = await db.insert(schema.authors).values({
        name: body.new_author.name,
        isFictional: body.new_author.is_fictional || false,
        job: body.new_author.job || null,
        description: body.new_author.description || null
      }).returning({ id: schema.authors.id }).get()
      
      authorId = authorResult.id
    }

    // Create new reference if provided
    if (body.new_reference && body.new_reference.name) {
      const referenceResult = await db.insert(schema.quoteReferences).values({
        name: body.new_reference.name,
        originalLanguage: body.new_reference.original_language || 'en',
        primaryType: body.new_reference.primary_type || 'other',
        description: body.new_reference.description || null,
        releaseDate: body.new_reference.release_date || null
      }).returning({ id: schema.quoteReferences.id }).get()
      
      referenceId = referenceResult.id
    }

    // Validate language
    const allowedLanguages = ['en', 'fr', 'es', 'de', 'it', 'pt', 'ru', 'ja', 'zh', 'la']
    if (body.language && !allowedLanguages.includes(body.language)) {
      throwServer(400, 'Invalid language code')
    }

    // Validate author_id if provided
    if (authorId) {
      const author = await db.select({ id: schema.authors.id })
        .from(schema.authors)
        .where(eq(schema.authors.id, authorId))
        .get()
      if (!author) {
        throwServer(400, 'Invalid author ID')
      }
    }

    // Validate reference_id if provided
    if (referenceId) {
      const reference = await db.select({ id: schema.quoteReferences.id })
        .from(schema.quoteReferences)
        .where(eq(schema.quoteReferences.id, referenceId))
        .get()
      if (!reference) {
        throwServer(400, 'Invalid reference ID')
      }
    }

    // Check for duplicate quotes (fuzzy matching)
    // Using SQL raw for LOWER and TRIM as they are standard SQL functions
    const similarQuotes = await db.select({ id: schema.quotes.id })
      .from(schema.quotes)
      .where(and(
        sql`LOWER(TRIM(${schema.quotes.name})) = LOWER(TRIM(${body.name}))`,
        ne(schema.quotes.status, 'rejected')
      ))
      .limit(1)
      .get()

    if (similarQuotes) {
      throwServer(409, 'A similar quote already exists')
    }

    // Insert the quote
    const quoteResult = await db.insert(schema.quotes).values({
      name: body.name.trim(),
      language: body.language || 'en',
      authorId: authorId || null,
      referenceId: referenceId || null,
      userId: user.id,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning({ id: schema.quotes.id }).get()

    const quoteId = quoteResult.id

    // Add tags if provided
    if (body.tags && Array.isArray(body.tags) && body.tags.length > 0) {
      for (const tagId of body.tags) {
        const tag = await db.select({ id: schema.tags.id })
          .from(schema.tags)
          .where(eq(schema.tags.id, tagId))
          .get()
        
        if (tag) {
          await db.insert(schema.quoteTags).values({
            quoteId: quoteId,
            tagId: tagId
          }).run()
        }
      }
    }

    // Fetch the created quote with all related data
    const createdQuote = await db.select({
      id: schema.quotes.id,
      name: schema.quotes.name,
      language: schema.quotes.language,
      authorId: schema.quotes.authorId,
      referenceId: schema.quotes.referenceId,
      userId: schema.quotes.userId,
      status: schema.quotes.status,
      viewsCount: schema.quotes.viewsCount,
      likesCount: schema.quotes.likesCount,
      sharesCount: schema.quotes.sharesCount,
      isFeatured: schema.quotes.isFeatured,
      createdAt: schema.quotes.createdAt,
      updatedAt: schema.quotes.updatedAt,
      authorName: schema.authors.name,
      authorIsFictional: schema.authors.isFictional,
      authorJob: schema.authors.job,
      authorDescription: schema.authors.description,
      referenceOriginalLanguage: schema.quoteReferences.originalLanguage,
      referenceName: schema.quoteReferences.name,
      referencePrimaryType: schema.quoteReferences.primaryType,
      referenceDescription: schema.quoteReferences.description,
      referenceReleaseDate: schema.quoteReferences.releaseDate,
      userName: schema.users.name,
      userEmail: schema.users.email,
      userAvatarUrl: schema.users.avatarUrl,
      userRole: schema.users.role
    })
    .from(schema.quotes)
    .leftJoin(schema.authors, eq(schema.quotes.authorId, schema.authors.id))
    .leftJoin(schema.quoteReferences, eq(schema.quotes.referenceId, schema.quoteReferences.id))
    .leftJoin(schema.users, eq(schema.quotes.userId, schema.users.id))
    .where(eq(schema.quotes.id, quoteId))
    .get()

    if (!createdQuote) {
      throwServer(500, 'Failed to fetch created quote')
    }
    const c = createdQuote!

    // Fetch tags for the quote
    const tags = await db.select({
      id: schema.tags.id,
      name: schema.tags.name,
      color: schema.tags.color
    })
    .from(schema.tags)
    .innerJoin(schema.quoteTags, eq(schema.tags.id, schema.quoteTags.tagId))
    .where(eq(schema.quoteTags.quoteId, quoteId))
    .all()

    // Transform the result
    const transformedQuote: QuoteWithMetadata = {
      id: c.id,
      name: c.name,
      language: c.language!,
      author_id: c.authorId ?? undefined,
      reference_id: c.referenceId ?? undefined,
      user_id: c.userId,
      status: c.status as QuoteStatus,
      views_count: c.viewsCount ?? 0,
      likes_count: c.likesCount ?? 0,
      shares_count: c.sharesCount ?? 0,
      is_featured: c.isFeatured ?? false,
      created_at: c.createdAt?.toISOString() || new Date().toISOString(),
      updated_at: c.updatedAt?.toISOString() || new Date().toISOString(),
      author: c.authorId ? {
        id: c.authorId,
        name: c.authorName ?? undefined,
        is_fictional: c.authorIsFictional ?? undefined,
        job: c.authorJob ?? undefined,
        description: c.authorDescription ?? undefined
      } : undefined,
      reference: c.referenceId ? {
        id: c.referenceId,
        name: c.referenceName ?? undefined,
        original_language: c.referenceOriginalLanguage ?? undefined,
        primary_type: c.referencePrimaryType ?? undefined,
        description: c.referenceDescription ?? undefined,
        release_date: c.referenceReleaseDate ?? undefined
      } : undefined,
      user: {
        id: c.userId,
        name: c.userName || '',
        email: c.userEmail ?? undefined,
        avatar_url: c.userAvatarUrl ?? undefined
      },
      tags: tags.map(t => ({
        id: t.id,
        name: t.name,
        color: t.color || 'gray'
      }))
    }

    return {
      success: true,
      data: transformedQuote,
      message: 'Quote submitted successfully and is pending moderation'
    }
  } catch (error: any) {
    if ((error as any).statusCode) throw error
    console.error('Error creating quote:', error)
    throwServer(500, 'Failed to create quote')
  }
})
