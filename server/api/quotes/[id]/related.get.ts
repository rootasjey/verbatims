export default defineEventHandler(async (event) => {
  try {
    const quoteId = getRouterParam(event, 'id')
    if (!quoteId || isNaN(parseInt(quoteId))) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid quote ID'
      })
    }

    const db = hubDatabase()

    // First, get the current quote's details to find related quotes
    const currentQuote = await db.prepare(`
      SELECT author_id, reference_id FROM quotes WHERE id = ? AND status = 'approved'
    `).bind(quoteId).first()

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
    let relatedQuotes = []

    // Get quotes by same author
    if (currentQuote.author_id) {
      const authorQuotes = await db.prepare(`
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
        WHERE q.author_id = ? AND q.id != ? AND q.status = 'approved'
        GROUP BY q.id
        ORDER BY q.likes_count DESC, q.views_count DESC
        LIMIT 3
      `).bind(currentQuote.author_id, quoteId).all()

      relatedQuotes.push(...authorQuotes)
    }

    // Get quotes from same reference if we need more
    if (relatedQuotes.length < 4 && currentQuote.reference_id) {
      const referenceQuotes = await db.prepare(`
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
        WHERE q.reference_id = ? AND q.id != ? AND q.status = 'approved'
        GROUP BY q.id
        ORDER BY q.likes_count DESC, q.views_count DESC
        LIMIT ?
      `).bind(currentQuote.reference_id, quoteId, 4 - relatedQuotes.length).all()

      // Filter out duplicates
      const existingIds = new Set(relatedQuotes.map(q => q.id))
      const newQuotes = referenceQuotes.filter(q => !existingIds.has(q.id))
      relatedQuotes.push(...newQuotes)
    }

    // If we still need more, get popular quotes with similar tags
    if (relatedQuotes.length < 4) {
      const tagQuotes = await db.prepare(`
        SELECT DISTINCT
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
        WHERE q.id IN (
          SELECT DISTINCT qt2.quote_id 
          FROM quote_tags qt2 
          WHERE qt2.tag_id IN (
            SELECT qt3.tag_id 
            FROM quote_tags qt3 
            WHERE qt3.quote_id = ?
          )
        )
        AND q.id != ? AND q.status = 'approved'
        GROUP BY q.id
        ORDER BY q.likes_count DESC, q.views_count DESC
        LIMIT ?
      `).bind(quoteId, quoteId, 4 - relatedQuotes.length).all()

      // Filter out duplicates
      const existingIds = new Set(relatedQuotes.map(q => q.id))
      const newQuotes = tagQuotes.filter(q => !existingIds.has(q.id))
      relatedQuotes.push(...newQuotes)
    }

    // Transform the results
    const transformedQuotes = relatedQuotes.slice(0, 4).map((quote) => ({
      id: quote.id,
      name: quote.name,
      language: quote.language,
      status: quote.status,
      views_count: quote.views_count,
      likes_count: quote.likes_count,
      shares_count: quote.shares_count,
      is_featured: quote.is_featured,
      created_at: quote.created_at,
      updated_at: quote.updated_at,
      author: quote.author_id ? {
        id: quote.author_id,
        name: quote.author_name,
        is_fictional: quote.author_is_fictional
      } : null,
      reference: quote.reference_id ? {
        id: quote.reference_id,
        name: quote.reference_name,
        type: quote.reference_type
      } : null,
      user: {
        name: quote.user_name
      },
      tags: quote.tag_names ? quote.tag_names.split(',').map((name, index) => ({
        name,
        color: quote.tag_colors.split(',')[index]
      })) : []
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
