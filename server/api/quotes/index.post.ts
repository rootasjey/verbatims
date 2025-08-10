import type {
  ApiResponse,
  QuoteWithMetadata,
  CreatedQuoteResult
} from '~/types'

export default defineEventHandler(async (event): Promise<ApiResponse<QuoteWithMetadata>> => {
  try {
    const session = await getUserSession(event)
    if (!session.user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication required'
      })
    }

    const body = await readBody(event)
    const db = hubDatabase()

    if (!body.name || body.name.length < 10 || body.name.length > 3000) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Quote text must be between 10 and 3000 characters'
      })
    }

    let authorId = body.author_id
    let referenceId = body.reference_id

    // Create new author if provided
    if (body.new_author && body.new_author.name) {
      const authorResult = await db.prepare(`
        INSERT INTO authors (name, is_fictional, job, description)
        VALUES (?, ?, ?, ?)
      `).bind(
        body.new_author.name,
        body.new_author.is_fictional || false,
        body.new_author.job || null,
        body.new_author.description || null
      ).run()
      
      authorId = authorResult.meta.last_row_id
    }

    // Create new reference if provided
    if (body.new_reference && body.new_reference.name) {
      const referenceResult = await db.prepare(`
        INSERT INTO quote_references (name, original_language, primary_type, description, release_date)
        VALUES (?, ?, ?, ?, ?)
      `).bind(
        body.new_reference.name,
        body.new_reference.original_language || 'en',
        body.new_reference.primary_type || 'other',
        body.new_reference.description || null,
        body.new_reference.release_date || null
      ).run()
      
      referenceId = referenceResult.meta.last_row_id
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
      const author = await db.prepare('SELECT id FROM authors WHERE id = ?')
        .bind(authorId).first()
      if (!author) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Invalid author ID'
        })
      }
    }

    // Validate reference_id if provided
    if (referenceId) {
      const reference = await db.prepare('SELECT id FROM quote_references WHERE id = ?')
        .bind(referenceId).first()
      if (!reference) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Invalid reference ID'
        })
      }
    }

    // Check for duplicate quotes (fuzzy matching)
    const similarQuotes = await db.prepare(`
      SELECT id, name FROM quotes 
      WHERE LOWER(TRIM(name)) = LOWER(TRIM(?))
      AND status != 'rejected'
      LIMIT 1
    `).bind(body.name).first()

    if (similarQuotes) {
      throw createError({
        statusCode: 409,
        statusMessage: 'A similar quote already exists'
      })
    }

    // Insert the quote
    const result = await db.prepare(`
      INSERT INTO quotes (
        name, language, author_id, reference_id, user_id, status
      ) VALUES (?, ?, ?, ?, ?, 'draft')
    `).bind(
      body.name.trim(),
      body.language || 'en',
      authorId || null,
      referenceId || null,
      session.user.id
    ).run()

    const quoteId = result.meta.last_row_id

    // Add tags if provided
    if (body.tags && Array.isArray(body.tags) && body.tags.length > 0) {
      for (const tagId of body.tags) {
        const tag = await db.prepare('SELECT id FROM tags WHERE id = ?')
          .bind(tagId).first()
        
        if (tag) {
          await db.prepare(`
            INSERT INTO quote_tags (quote_id, tag_id) VALUES (?, ?)
          `).bind(quoteId, tagId).run()
        }
      }
    }

    // Fetch the created quote with all related data
    const createdQuoteResult = await db.prepare(`
      SELECT
        q.*,
        a.name as author_name,
        a.is_fictional as author_is_fictional,
        r.name as reference_name,
        r.primary_type as reference_type,
        u.name as user_name,
        GROUP_CONCAT(t.name) as tag_names,
        GROUP_CONCAT(t.color) as tag_colors
      FROM quotes q
      LEFT JOIN authors a ON q.author_id = a.id
      LEFT JOIN quote_references r ON q.reference_id = r.id
      LEFT JOIN users u ON q.user_id = u.id
      LEFT JOIN quote_tags qt ON q.id = qt.quote_id
      LEFT JOIN tags t ON qt.tag_id = t.id
      WHERE q.id = ?
      GROUP BY q.id
    `).bind(quoteId).first()

    if (!createdQuoteResult) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch created quote'
      })
    }

    const createdQuote = createdQuoteResult as unknown as CreatedQuoteResult

    // Transform the result
    const transformedQuote: QuoteWithMetadata = {
      id: createdQuote.id,
      name: createdQuote.name,
      language: createdQuote.language,
      author_id: createdQuote.author_id,
      reference_id: createdQuote.reference_id,
      user_id: createdQuote.user_id,
      status: createdQuote.status as any, // Will be properly typed in the Quote interface
      moderator_id: undefined,
      moderated_at: undefined,
      rejection_reason: undefined,
      views_count: createdQuote.views_count,
      likes_count: createdQuote.likes_count,
      shares_count: createdQuote.shares_count,
      is_featured: createdQuote.is_featured,
      created_at: createdQuote.created_at,
      updated_at: createdQuote.updated_at,
      author: createdQuote.author_id ? {
        id: createdQuote.author_id,
        name: createdQuote.author_name || '',
        is_fictional: createdQuote.author_is_fictional || false,
        birth_date: undefined,
        birth_location: undefined,
        death_date: undefined,
        death_location: undefined,
        job: undefined,
        description: undefined,
        image_url: undefined,
        socials: '{}',
        views_count: 0,
        likes_count: 0,
        shares_count: 0,
        created_at: '',
        updated_at: ''
      } : undefined,
      reference: createdQuote.reference_id ? {
        id: createdQuote.reference_id,
        name: createdQuote.reference_name || '',
        original_language: 'en',
        release_date: undefined,
        description: undefined,
        primary_type: createdQuote.reference_type as any || 'other',
        secondary_type: undefined,
        image_url: undefined,
        urls: '{}',
        views_count: 0,
        likes_count: 0,
        shares_count: 0,
        created_at: '',
        updated_at: ''
      } : undefined,
      tags: createdQuote.tag_names ? createdQuote.tag_names.split(',').map((name: string, index: number) => ({
        id: index + 1, // Temporary ID for display
        name,
        color: createdQuote.tag_colors?.split(',')[index] || 'gray'
      })) : []
    }

    return {
      success: true,
      data: transformedQuote,
      message: 'Quote submitted successfully and is pending moderation'
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    
    console.error('Error creating quote:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create quote'
    })
  }
})
