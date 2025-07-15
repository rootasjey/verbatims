export default defineEventHandler(async (event) => {
  try {
    // Check authentication
    const session = await getUserSession(event)
    if (!session.user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication required'
      })
    }

    const body = await readBody(event)
    const db = hubDatabase()

    // Validate required fields
    if (!body.name || body.name.length < 10 || body.name.length > 3000) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Quote text must be between 10 and 3000 characters'
      })
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
    if (body.author_id) {
      const author = await db.prepare('SELECT id FROM authors WHERE id = ?')
        .bind(body.author_id).first()
      if (!author) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Invalid author ID'
        })
      }
    }

    // Validate reference_id if provided
    if (body.reference_id) {
      const reference = await db.prepare('SELECT id FROM references WHERE id = ?')
        .bind(body.reference_id).first()
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
      body.author_id || null,
      body.reference_id || null,
      session.user.id
    ).run()

    const quoteId = result.meta.last_row_id

    // Add tags if provided
    if (body.tags && Array.isArray(body.tags) && body.tags.length > 0) {
      for (const tagId of body.tags) {
        // Verify tag exists
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
    const createdQuote = await db.prepare(`
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
      LEFT JOIN references r ON q.reference_id = r.id
      LEFT JOIN users u ON q.user_id = u.id
      LEFT JOIN quote_tags qt ON q.id = qt.quote_id
      LEFT JOIN tags t ON qt.tag_id = t.id
      WHERE q.id = ?
      GROUP BY q.id
    `).bind(quoteId).first()

    // Transform the result
    const transformedQuote = {
      id: createdQuote.id,
      name: createdQuote.name,
      language: createdQuote.language,
      status: createdQuote.status,
      views_count: createdQuote.views_count,
      likes_count: createdQuote.likes_count,
      shares_count: createdQuote.shares_count,
      is_featured: createdQuote.is_featured,
      created_at: createdQuote.created_at,
      updated_at: createdQuote.updated_at,
      author: createdQuote.author_id ? {
        id: createdQuote.author_id,
        name: createdQuote.author_name,
        is_fictional: createdQuote.author_is_fictional
      } : null,
      reference: createdQuote.reference_id ? {
        id: createdQuote.reference_id,
        name: createdQuote.reference_name,
        type: createdQuote.reference_type
      } : null,
      user: {
        name: createdQuote.user_name
      },
      tags: createdQuote.tag_names ? createdQuote.tag_names.split(',').map((name, index) => ({
        name,
        color: createdQuote.tag_colors.split(',')[index]
      })) : []
    }

    return {
      success: true,
      data: transformedQuote,
      message: 'Quote submitted successfully and is pending moderation'
    }
  } catch (error) {
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
