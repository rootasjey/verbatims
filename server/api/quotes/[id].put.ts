import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'
import { toISOStringOrNull } from '../../utils/date-normalization'
import { updateQuoteSchema } from '../../validation/schemas'

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireAuth(event)

    const quoteId = getRouterParam(event, 'id')
    if (!quoteId || isNaN(parseInt(quoteId))) {
      throwServer(400, 'Invalid quote ID')
    }

    const body = await readValidatedBody(event, updateQuoteSchema.parse)

    const existingQuote = await db.select().from(schema.quotes).where(eq(schema.quotes.id, parseInt(quoteId!))).get()
    if (!existingQuote) throwServer(404, 'Quote not found')
    const e = existingQuote

    const isAdmin = user.role === 'admin' || user.role === 'moderator'
    const isOwner = e.userId === user.id
    const isDraft = e.status === 'draft'

    if (!isAdmin && (!isOwner || !isDraft)) {
      throwServer(403, 'You can only edit your own draft quotes')
    }

    let authorId = body.author_id
    let referenceId = body.reference_id

    if (body.new_author?.name) {
      const newAuthor = await db.insert(schema.authors).values({
        name: body.new_author.name,
        isFictional: body.new_author.is_fictional,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning({ id: schema.authors.id }).get()
      authorId = newAuthor.id
    }

    if (body.new_reference?.name) {
      const newReference = await db.insert(schema.quoteReferences).values({
        name: body.new_reference.name,
        originalLanguage: body.new_reference.original_language || body.language || 'en',
        primaryType: body.new_reference.primary_type || 'other',
        createdAt: new Date(),
        updatedAt: new Date()
      } as any).returning({ id: schema.quoteReferences.id }).get()
      referenceId = newReference.id
    }

    await db.update(schema.quotes)
      .set({
        name: body.name!,
        language: body.language || 'en',
        authorId: authorId || null,
        referenceId: referenceId || null,
        updatedAt: new Date()
      } as any)
      .where(eq(schema.quotes.id, parseInt(quoteId!)))
      .run()

    // Fetch the updated quote with all related data
    const updatedQuote = await db.select({
      id: schema.quotes.id,
      name: schema.quotes.name,
      language: schema.quotes.language,
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
    .where(eq(schema.quotes.id, parseInt(quoteId!)))
    .get()

    if (!updatedQuote) {
      throwServer(500, 'Failed to fetch updated quote')
    }
    const u = updatedQuote!

    // Fetch tags for the quote
    const tags = await db.select({
      id: schema.tags.id,
      name: schema.tags.name,
      color: schema.tags.color
    })
    .from(schema.tags)
    .innerJoin(schema.quoteTags, eq(schema.tags.id, schema.quoteTags.tagId))
    .where(eq(schema.quoteTags.quoteId, parseInt(quoteId!)))
    .all()

    const transformedQuote: QuoteWithMetadata = {
      id: u.id,
      name: u.name,
      language: u.language!,
      author_id: u.authorId ?? undefined,
      reference_id: u.referenceId ?? undefined,
      user_id: u.userId,
      status: u.status as QuoteStatus,
      moderator_id: u.moderatorId ?? undefined,
      moderated_at: toISOStringOrNull(u.moderatedAt) ?? undefined,
      rejection_reason: u.rejectionReason ?? undefined,
      views_count: u.viewsCount ?? 0,
      likes_count: u.likesCount ?? 0,
      shares_count: u.sharesCount ?? 0,
      is_featured: u.isFeatured ?? false,
      created_at: toISOStringOrNull(u.createdAt) || '',
      updated_at: toISOStringOrNull(u.updatedAt) || '',
      author: u.authorId ? {
        id: u.authorId,
        name: u.authorName ?? undefined,
        is_fictional: u.authorIsFictional ?? undefined
      } : undefined,
      reference: u.referenceId ? {
        id: u.referenceId,
        name: u.referenceName ?? undefined,
        primary_type: u.referencePrimaryType || 'other'
      } : undefined,
      user: {
        id: u.userId,
        name: u.userName || ''
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
    
    throwServer(500, 'Internal server error')
  }
})
