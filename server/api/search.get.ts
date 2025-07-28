export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const searchTerm = query.q as string
    const language = query.language as string
    const authorId = query.author ? parseInt(query.author as string) : null
    const referenceId = query.reference ? parseInt(query.reference as string) : null
    const limit = Math.min(parseInt(query.limit as string) || 20, 50)
    const contentType = query.type as string // 'quotes', 'authors', 'references', or 'all'

    if (!searchTerm || searchTerm.trim().length < 2) {
      return {
        success: true,
        data: {
          quotes: [],
          authors: [],
          references: [],
          total: 0
        }
      }
    }

    const db = hubDatabase()
    const searchPattern = `%${searchTerm.trim()}%`
    const results = {
      quotes: [],
      authors: [],
      references: [],
      total: 0
    }

    // Search quotes if requested
    if (!contentType || contentType === 'all' || contentType === 'quotes') {
      let quotesQuery = `
        SELECT 
          q.*,
          a.name as author_name,
          a.is_fictional as author_is_fictional,
          a.image_url as author_image_url,
          r.name as reference_name,
          r.primary_type as reference_type,
          u.name as user_name,
          GROUP_CONCAT(t.name) as tag_names,
          GROUP_CONCAT(t.color) as tag_colors,
          'quote' as result_type
        FROM quotes q
        LEFT JOIN authors a ON q.author_id = a.id
        LEFT JOIN quote_references r ON q.reference_id = r.id
        LEFT JOIN users u ON q.user_id = u.id
        LEFT JOIN quote_tags qt ON q.id = qt.quote_id
        LEFT JOIN tags t ON qt.tag_id = t.id
        WHERE q.status = 'approved' AND q.name LIKE ?
      `
      
      const quotesParams = [searchPattern]
      
      // Add language filter
      if (language) {
        quotesQuery += ' AND q.language = ?'
        quotesParams.push(language)
      }
      
      // Add author filter
      if (authorId) {
        quotesQuery += ' AND q.author_id = ?'
        quotesParams.push(authorId.toString())
      }
      
      // Add reference filter
      if (referenceId) {
        quotesQuery += ' AND q.reference_id = ?'
        quotesParams.push(referenceId.toString())
      }
      
      quotesQuery += `
        GROUP BY q.id
        ORDER BY q.likes_count DESC, q.views_count DESC, q.created_at DESC
        LIMIT ?
      `
      quotesParams.push(limit.toString())
      
      const quotesResult = await db.prepare(quotesQuery).bind(...quotesParams).all()
      const quotes = quotesResult?.results || []

      results.quotes = quotes.map(quote => ({
        ...quote,
        tags: quote.tag_names ? quote.tag_names.split(',').map((name, index) => ({
          name,
          color: quote.tag_colors?.split(',')[index] || 'gray'
        })) : []
      }))
    }

    // Search authors if requested
    if (!contentType || contentType === 'all' || contentType === 'authors') {
      const authorsQuery = `
        SELECT 
          a.*,
          'author' as result_type,
          COUNT(q.id) as quotes_count
        FROM authors a
        LEFT JOIN quotes q ON a.id = q.author_id AND q.status = 'approved'
        WHERE a.name LIKE ? OR a.description LIKE ? OR a.job LIKE ?
        GROUP BY a.id
        ORDER BY a.likes_count DESC, a.views_count DESC, quotes_count DESC
        LIMIT ?
      `
      
      const authorsResult = await db.prepare(authorsQuery)
        .bind(searchPattern, searchPattern, searchPattern, limit.toString())
        .all()

      results.authors = authorsResult?.results || []
    }

    // Search references if requested
    if (!contentType || contentType === 'all' || contentType === 'references') {
      const referencesQuery = `
        SELECT
          r.*,
          'reference' as result_type,
          COUNT(q.id) as quotes_count
        FROM quote_references r
        LEFT JOIN quotes q ON r.id = q.reference_id AND q.status = 'approved'
        WHERE r.name LIKE ? OR r.description LIKE ? OR r.secondary_type LIKE ?
        GROUP BY r.id
        ORDER BY r.likes_count DESC, r.views_count DESC, quotes_count DESC
        LIMIT ?
      `
      
      const referencesResult = await db.prepare(referencesQuery)
        .bind(searchPattern, searchPattern, searchPattern, limit.toString())
        .all()

      results.references = referencesResult?.results || []
    }

    // If searching all content types, limit total results and balance them
    if (!contentType || contentType === 'all') {
      const maxPerType = Math.floor(limit / 3)
      results.quotes = results.quotes.slice(0, maxPerType)
      results.authors = results.authors.slice(0, maxPerType)
      results.references = results.references.slice(0, maxPerType)

      // Fill remaining slots with quotes (most important content)
      const remaining = limit - (results.quotes.length + results.authors.length + results.references.length)
      if (remaining > 0 && results.quotes.length < limit) {
        const additionalQuotesResult = await db.prepare(`
          SELECT
            q.*,
            a.name as author_name,
            a.is_fictional as author_is_fictional,
            a.image_url as author_image_url,
            r.name as reference_name,
            r.primary_type as reference_type,
            u.name as user_name,
            GROUP_CONCAT(t.name) as tag_names,
            GROUP_CONCAT(t.color) as tag_colors,
            'quote' as result_type
          FROM quotes q
          LEFT JOIN authors a ON q.author_id = a.id
          LEFT JOIN quote_references r ON q.reference_id = r.id
          LEFT JOIN users u ON q.user_id = u.id
          LEFT JOIN quote_tags qt ON q.id = qt.quote_id
          LEFT JOIN tags t ON qt.tag_id = t.id
          WHERE q.status = 'approved' AND (
            a.name LIKE ? OR r.name LIKE ? OR
            EXISTS (SELECT 1 FROM tags t2 JOIN quote_tags qt2 ON t2.id = qt2.tag_id WHERE qt2.quote_id = q.id AND t2.name LIKE ?)
          )
          GROUP BY q.id
          ORDER BY q.likes_count DESC, q.views_count DESC
          LIMIT ?
        `).bind(searchPattern, searchPattern, searchPattern, remaining.toString()).all()

        const additionalQuotes = additionalQuotesResult?.results || []
        const processedAdditionalQuotes = additionalQuotes.map(quote => ({
          ...quote,
          tags: quote.tag_names ? quote.tag_names.split(',').map((name, index) => ({
            name,
            color: quote.tag_colors?.split(',')[index] || 'gray'
          })) : []
        }))

        // Merge without duplicates
        const existingIds = new Set(results.quotes.map(q => q.id))
        const newQuotes = processedAdditionalQuotes.filter(q => !existingIds.has(q.id))
        results.quotes.push(...newQuotes.slice(0, remaining))
      }
    }

    // Calculate total results
    results.total = results.quotes.length + results.authors.length + results.references.length

    return {
      success: true,
      data: results
    }
  } catch (error) {
    console.error('Search error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Search failed'
    })
  }
})
