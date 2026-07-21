import { db, schema } from 'hub:db'
import { eq, sql, and, ne } from 'drizzle-orm'
import { createQuoteSchema } from '../../../validation/schemas'

defineRouteMeta({
  openAPI: {
    summary: 'Create a quote',
    description: 'Creates a new quote in draft status. The quote will be associated with the API key owner and requires moderation before being publicly visible.',
    tags: ['Quotes'],
    security: [{ apiKey: ['write:quotes'] }],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['name'],
            properties: {
              name: { type: 'string', description: 'Quote content' },
              language: { type: 'string', enum: ['en', 'fr', 'es', 'de', 'it', 'pt', 'ru', 'ja', 'zh', 'la', 'ar', 'ko'], default: 'en' },
              author_id: { type: 'integer', nullable: true, description: 'ID of an existing author' },
              reference_id: { type: 'integer', nullable: true, description: 'ID of an existing reference' },
              new_author: {
                type: 'object',
                properties: { name: { type: 'string' }, is_fictional: { type: 'boolean', default: false }, job: { type: 'string', nullable: true }, description: { type: 'string', nullable: true } },
                description: 'Create a new author inline',
              },
              new_reference: {
                type: 'object',
                properties: { name: { type: 'string' }, primary_type: { type: 'string', default: 'other' }, original_language: { type: 'string', default: 'en' }, description: { type: 'string', nullable: true }, release_date: { type: 'string', nullable: true } },
                description: 'Create a new reference inline',
              },
              tags: { type: 'array', items: { type: 'number' }, maxItems: 20, description: 'Tag IDs to associate' },
            },
          },
        },
      },
    },
    responses: {
      '201': { description: 'Quote created' },
      '400': { description: 'Validation error or invalid author/reference ID' },
      '409': { description: 'Similar quote already exists' },
    },
  },
})

export default defineEventHandler(async (event) => {
  const api = event.context.api
  requireApiPermission(api, 'write:quotes')

  const body = await readValidatedBody(event, createQuoteSchema.parse)

  let authorId = body.author_id
  let referenceId = body.reference_id

  if (body.new_author?.name) {
    const authorResult = await db.insert(schema.authors).values({
      name: body.new_author.name,
      isFictional: body.new_author.is_fictional || false,
      job: body.new_author.job || null,
      description: body.new_author.description || null
    }).returning({ id: schema.authors.id }).get()
    authorId = authorResult.id
  }

  if (body.new_reference?.name) {
    const referenceResult = await db.insert(schema.quoteReferences).values({
      name: body.new_reference.name,
      originalLanguage: body.new_reference.original_language || 'en',
      primaryType: body.new_reference.primary_type || 'other',
      description: body.new_reference.description ?? null,
      releaseDate: body.new_reference.release_date ?? null,
    } as any).returning({ id: schema.quoteReferences.id }).get()
    referenceId = referenceResult.id
  }

  if (authorId) {
    const author = await db.select({ id: schema.authors.id })
      .from(schema.authors)
      .where(eq(schema.authors.id, authorId))
      .get()
    if (!author) throwServer(400, 'Invalid author ID')
  }

  if (referenceId) {
    const reference = await db.select({ id: schema.quoteReferences.id })
      .from(schema.quoteReferences)
      .where(eq(schema.quoteReferences.id, referenceId))
      .get()
    if (!reference) throwServer(400, 'Invalid reference ID')
  }

  const similarQuotes = await db.select({ id: schema.quotes.id })
    .from(schema.quotes)
    .where(and(
      sql`LOWER(TRIM(${schema.quotes.name})) = LOWER(TRIM(${body.name}))`,
      ne(schema.quotes.status, 'rejected')
    ))
    .limit(1)
    .get()

  if (similarQuotes) throwServer(409, 'A similar quote already exists')

  const quoteResult = await db.insert(schema.quotes).values({
    name: body.name,
    language: body.language,
    authorId: authorId || null,
    referenceId: referenceId || null,
    userId: api.userId,
    status: 'draft',
    createdAt: new Date(),
    updatedAt: new Date()
  } as any).returning({ id: schema.quotes.id }).get()

  if (body.tags && body.tags.length > 0) {
    for (const tagId of body.tags) {
      const tag = await db.select({ id: schema.tags.id })
        .from(schema.tags)
        .where(eq(schema.tags.id, Number(tagId)))
        .get()
      if (tag) {
        await db.insert(schema.quoteTags).values({
          quoteId: quoteResult.id,
          tagId: tagId
        } as any).run()
      }
    }
  }

  const createdQuote = await db
    .select({
      id: schema.quotes.id,
      name: schema.quotes.name,
      language: schema.quotes.language,
      viewsCount: schema.quotes.viewsCount,
      likesCount: schema.quotes.likesCount,
      sharesCount: schema.quotes.sharesCount,
      isFeatured: schema.quotes.isFeatured,
      sourceType: schema.quotes.sourceType,
      sourceUrl: schema.quotes.sourceUrl,
      createdAt: schema.quotes.createdAt,
      updatedAt: schema.quotes.updatedAt,
      authorId: schema.quotes.authorId,
      referenceId: schema.quotes.referenceId,
      authorName: schema.authors.name,
      authorIsFictional: schema.authors.isFictional,
      authorImageUrl: schema.authors.imageUrl,
      authorDescription: schema.authors.description,
      referenceName: schema.quoteReferences.name,
      referencePrimaryType: schema.quoteReferences.primaryType,
      referenceImageUrl: schema.quoteReferences.imageUrl,
      referenceDescription: schema.quoteReferences.description,
    })
    .from(schema.quotes)
    .leftJoin(schema.authors, eq(schema.quotes.authorId, schema.authors.id))
    .leftJoin(schema.quoteReferences, eq(schema.quotes.referenceId, schema.quoteReferences.id))
    .where(eq(schema.quotes.id, quoteResult.id))
    .get()

  const tags = await db
    .select({ name: schema.tags.name, color: schema.tags.color })
    .from(schema.tags)
    .innerJoin(schema.quoteTags, eq(schema.tags.id, schema.quoteTags.tagId))
    .where(eq(schema.quoteTags.quoteId, quoteResult.id))
    .all()

  return {
    success: true,
    data: {
      id: createdQuote!.id,
      content: createdQuote!.name,
      language: createdQuote!.language,
      stats: {
        views: createdQuote!.viewsCount,
        likes: createdQuote!.likesCount,
        shares: createdQuote!.sharesCount,
      },
      featured: createdQuote!.isFeatured,
      source: createdQuote!.sourceType ? {
        type: createdQuote!.sourceType,
        url: createdQuote!.sourceUrl,
      } : null,
      author: createdQuote!.authorId ? {
        id: createdQuote!.authorId,
        name: createdQuote!.authorName,
        fictional: createdQuote!.authorIsFictional,
        image_url: createdQuote!.authorImageUrl,
        description: createdQuote!.authorDescription,
      } : null,
      reference: createdQuote!.referenceId ? {
        id: createdQuote!.referenceId,
        name: createdQuote!.referenceName,
        type: createdQuote!.referencePrimaryType,
        image_url: createdQuote!.referenceImageUrl,
        description: createdQuote!.referenceDescription,
      } : null,
      tags: tags.map(t => ({ name: t.name, color: t.color })),
      created_at: createdQuote!.createdAt,
      updated_at: createdQuote!.updatedAt,
    },
    message: 'Quote created successfully and is pending moderation',
  }
})
