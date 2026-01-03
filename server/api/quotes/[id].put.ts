import type {
  ApiResponse,
  QuoteWithMetadata,
  CreatedQuoteResult
} from '~/types'
import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event): Promise<ApiResponse<QuoteWithMetadata>> => {
  try {
    const session = await requireUserSession(event)
    if (!session.user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication required'
      })
    }

    const quoteId = getRouterParam(event, 'id')
    if (!quoteId || isNaN(parseInt(quoteId))) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid quote ID'
      })
    }

    const body = await readBody(event)

    // Validate required fields
    if (!body.name || body.name.length < 2 || body.name.length > 3000) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Quote text must be between 2 and 3000 characters'
      })
    }

    // Check if quote exists and user has permission to edit it
    const existingQuote = await db.select().from(schema.quotes).where(eq(schema.quotes.id, parseInt(quoteId))).get()

    if (!existingQuote) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Quote not found'
      })
    }

    // Check permissions: users can only edit their own drafts, admins can edit any quote
    const isAdmin = session.user.role === 'admin' || session.user.role === 'moderator'
    const isOwner = existingQuote.userId === session.user.id
    const isDraft = existingQuote.status === 'draft'

    if (!isAdmin && (!isOwner || !isDraft)) {
      throw createError({
        statusCode: 403,
        statusMessage: 'You can only edit your own draft quotes'
      })
    }

    let authorId = body.author_id
    let referenceId = body.reference_id

    // Handle new author creation
    if (body.new_author && body.new_author.name) {
      const newAuthor = await db.insert(schema.authors).values({
        name: body.new_author.name.trim(),
        isFictional: body.new_author.is_fictional || false,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning({ id: schema.authors.id }).get()

      authorId = newAuthor.id
    }

    // Handle new reference creation
    if (body.new_reference && body.new_reference.name) {
      const newReference = await db.insert(schema.quoteReferences).values({
        name: body.new_reference.name.trim(),
        originalLanguage: body.new_reference.original_language || body.language || 'en',
        primaryType: body.new_reference.primary_type || 'other',
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning({ id: schema.quoteReferences.id }).get()

      referenceId = newReference.id
    }

    // Update the quote
    await db.update(schema.quotes)
      .set({
        name: body.name.trim(),
        originalLanguage: body.language || 'en',
        authorId: authorId || null,
        referenceId: referenceId || null,
        updatedAt: new Date()
      })
      .where(eq(schema.quotes.id, parseInt(quoteId)))
      .run()

    // Fetch the updated quote with all related data
    const updatedQuote = await db.select({
      id: schema.quotes.id,
      name: schema.quotes.name,
      originalLanguage: schema.quotes.originalLanguage,
      authorId: schema.quotes.authorId,
      referenceId: schema.quotes.referenceId,
      userId: schema.quotes.userId,
      status: schema.quotes.status,
      moderatorId: schema.quotes.moderatorId,
      moderatedAt: schema.quotes.moderatedAt,
      rejectionReason: schema.quotes.rejectionReason,
      viewsCount: schema.quotes.viewsCount,
      likesCount: schema.quotes.likesCount,
      sharesCount: schema.quotes.sharesCount,
      isFeatured: schema.quotes.isFeatured,
      createdAt: schema.quotes.createdAt,
      updatedAt: schema.quotes.updatedAt,
      author: {
        id: schema.authors.id,
        name: schema.authors.name,
        isFictional: schema.authors.isFictional
      },
      reference: {
        id: schema.quoteReferences.id,
        name: schema.quoteReferences.name,
        primaryType: schema.quoteReferences.primaryType
      },
      user: {
        id: schema.users.id,
        name: schema.users.name
      }
    })
    .from(schema.quotes)
    .leftJoin(schema.authors, eq(schema.quotes.authorId, schema.authors.id))
    .leftJoin(schema.quoteReferences, eq(schema.quotes.referenceId, schema.quoteReferences.id))
    .leftJoin(schema.users, eq(schema.quotes.userId, schema.users.id))
    .where(eq(schema.quotes.id, parseInt(quoteId)))
    .get()

    if (!updatedQuote) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch updated quote'
      })
    }

    // Fetch tags for the quote
    const tags = await db.select({
      id: schema.tags.id,
      name: schema.tags.name,
      color: schema.tags.color
    })
    .from(schema.tags)
    .innerJoin(schema.quotesTags, eq(schema.tags.id, schema.quotesTags.tagId))
    .where(eq(schema.quotesTags.quoteId, parseInt(quoteId)))
    .all()

    const transformedQuote: QuoteWithMetadata = {
      id: updatedQuote.id,
      name: updatedQuote.name,
      language: updatedQuote.originalLanguage,
      author_id: updatedQuote.authorId,
      reference_id: updatedQuote.referenceId,
      user_id: updatedQuote.userId,
      status: updatedQuote.status as any,
      moderator_id: updatedQuote.moderatorId,
      moderated_at: updatedQuote.moderatedAt,
      rejection_reason: updatedQuote.rejectionReason,
      views_count: updatedQuote.viewsCount,
      likes_count: updatedQuote.likesCount,
      shares_count: updatedQuote.sharesCount,
      is_featured: updatedQuote.isFeatured,
      created_at: updatedQuote.createdAt,
      updated_at: updatedQuote.updatedAt,
      author: updatedQuote.author ? {
        id: updatedQuote.author.id,
        name: updatedQuote.author.name,
        is_fictional: updatedQuote.author.isFictional
      } : undefined,
      reference: updatedQuote.reference ? {
        id: updatedQuote.reference.id,
        name: updatedQuote.reference.name,
        primary_type: updatedQuote.reference.primaryType || 'other'
      } : undefined,
      user: {
        id: updatedQuote.user.id,
        name: updatedQuote.user.name || ''
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
      message: 'Quote updated successfully'
    }

  } catch (error: any) {
    console.error('Error updating quote:', error)
    
    if ((error as any).statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})
