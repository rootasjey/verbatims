import type {
  ApiResponse,
  QuoteWithMetadata,
  CreatedQuoteResult
} from '~/types'
import { db, schema } from 'hub:db'
import { eq, sql, and, ne } from 'drizzle-orm'

export default defineEventHandler(async (event): Promise<ApiResponse<QuoteWithMetadata>> => {
  try {
    const { user } = await requireUserSession(event)

    const body = await readBody(event)

    if (!body.name || body.name.length < 2 || body.name.length > 4000) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Quote text must be between 2 and 4000 characters'
      })
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
    const allowedLanguages = ['en', 'fr', 'es', 'de', 'it', 'pt', 'ru', 'ja', 'zh']
    if (body.language && !allowedLanguages.includes(body.language)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid language code'
      })
    }

    // Validate author_id if provided
    if (authorId) {
      const author = await db.select({ id: schema.authors.id })
        .from(schema.authors)
        .where(eq(schema.authors.id, authorId))
        .get()
      if (!author) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Invalid author ID'
        })
      }
    }

    // Validate reference_id if provided
    if (referenceId) {
      const reference = await db.select({ id: schema.quoteReferences.id })
        .from(schema.quoteReferences)
        .where(eq(schema.quoteReferences.id, referenceId))
        .get()
      if (!reference) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Invalid reference ID'
        })
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
      throw createError({
        statusCode: 409,
        statusMessage: 'A similar quote already exists'
      })
    }

    // Insert the quote
    const quoteResult = await db.insert(schema.quotes).values({
      name: body.name.trim(),
      originalLanguage: body.language || 'en',
      authorId: authorId || null,
      referenceId: referenceId || null,
      userId: user.id,
      status: 'draft',
      isFictional: body.is_fictional || false,
      context: body.context || null,
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
          await db.insert(schema.quotesTags).values({
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
      originalLanguage: schema.quotes.originalLanguage,
      authorId: schema.quotes.authorId,
      referenceId: schema.quotes.referenceId,
      userId: schema.quotes.userId,
      status: schema.quotes.status,
      isFictional: schema.quotes.isFictional,
      context: schema.quotes.context,
      viewsCount: schema.quotes.viewsCount,
      likesCount: schema.quotes.likesCount,
      sharesCount: schema.quotes.sharesCount,
      createdAt: schema.quotes.createdAt,
      updatedAt: schema.quotes.updatedAt,
      author: {
        id: schema.authors.id,
        name: schema.authors.name,
        isFictional: schema.authors.isFictional,
        job: schema.authors.job,
        description: schema.authors.description
      },
      reference: {
        id: schema.quoteReferences.id,
        name: schema.quoteReferences.name,
        originalLanguage: schema.quoteReferences.originalLanguage,
        primaryType: schema.quoteReferences.primaryType,
        description: schema.quoteReferences.description,
        releaseDate: schema.quoteReferences.releaseDate
      },
      user: {
        id: schema.users.id,
        name: schema.users.name,
        email: schema.users.email,
        avatar: schema.users.avatar,
        role: schema.users.role
      }
    })
    .from(schema.quotes)
    .leftJoin(schema.authors, eq(schema.quotes.authorId, schema.authors.id))
    .leftJoin(schema.quoteReferences, eq(schema.quotes.referenceId, schema.quoteReferences.id))
    .leftJoin(schema.users, eq(schema.quotes.userId, schema.users.id))
    .where(eq(schema.quotes.id, quoteId))
    .get()

    if (!createdQuote) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch created quote'
      })
    }

    // Fetch tags for the quote
    const tags = await db.select({
      id: schema.tags.id,
      name: schema.tags.name,
      slug: schema.tags.slug,
      color: schema.tags.color
    })
    .from(schema.tags)
    .innerJoin(schema.quotesTags, eq(schema.tags.id, schema.quotesTags.tagId))
    .where(eq(schema.quotesTags.quoteId, quoteId))
    .all()

    // Transform the result
    const transformedQuote: QuoteWithMetadata = {
      id: createdQuote.id,
      name: createdQuote.name,
      language: (createdQuote as any).language,
      author_id: createdQuote.authorId,
      reference_id: createdQuote.referenceId,
      user_id: createdQuote.userId,
      status: createdQuote.status as any,
      views_count: createdQuote.viewsCount,
      likes_count: createdQuote.likesCount,
      shares_count: createdQuote.sharesCount,
      is_featured: createdQuote.isFeatured,
      created_at: createdQuote.createdAt,
      updated_at: createdQuote.updatedAt,
      author: createdQuote.author ? {
        id: createdQuote.author.id,
        name: createdQuote.author.name,
        is_fictional: createdQuote.author.isFictional,
        job: createdQuote.author.job,
        description: createdQuote.author.description
      } : undefined,
      reference: createdQuote.reference ? {
        id: createdQuote.reference.id,
        name: createdQuote.reference.name,
        original_language: createdQuote.reference.originalLanguage,
        primary_type: createdQuote.reference.primaryType,
        description: createdQuote.reference.description,
        release_date: createdQuote.reference.releaseDate
      } : undefined,
      user: {
        id: createdQuote.user.id,
        name: createdQuote.user.name,
        email: createdQuote.user.email,
        avatar_url: (createdQuote.user as any).avatar_url ?? (createdQuote.user as any).avatarUrl ?? (createdQuote.user as any).avatar
      },
      tags: tags.map(t => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        color: t.color
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
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create quote'
    })
  }
})
