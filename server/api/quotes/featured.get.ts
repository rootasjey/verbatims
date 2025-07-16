export default defineEventHandler(async (event) => {
  try {
    const db = hubDatabase()
    
    // Get a featured quote (either marked as featured or random popular quote)
    let featuredQuote = await db.prepare(`
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
      WHERE q.status = 'approved' AND q.is_featured = 1
      GROUP BY q.id
      ORDER BY q.created_at DESC
      LIMIT 1
    `).first()
    
    // If no featured quote, get a popular one
    if (!featuredQuote) {
      featuredQuote = await db.prepare(`
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
        WHERE q.status = 'approved'
        GROUP BY q.id
        ORDER BY (q.likes_count + q.views_count) DESC
        LIMIT 1
      `).first()
    }
    
    if (!featuredQuote) {
      return {
        success: true,
        data: null
      }
    }
    
    // Transform the result
    const transformedQuote = {
      id: featuredQuote.id,
      name: featuredQuote.name,
      language: featuredQuote.language,
      status: featuredQuote.status,
      views_count: featuredQuote.views_count,
      likes_count: featuredQuote.likes_count,
      shares_count: featuredQuote.shares_count,
      is_featured: featuredQuote.is_featured,
      created_at: featuredQuote.created_at,
      updated_at: featuredQuote.updated_at,
      author: featuredQuote.author_id ? {
        id: featuredQuote.author_id,
        name: featuredQuote.author_name,
        is_fictional: featuredQuote.author_is_fictional
      } : null,
      reference: featuredQuote.reference_id ? {
        id: featuredQuote.reference_id,
        name: featuredQuote.reference_name,
        type: featuredQuote.reference_type
      } : null,
      user: {
        name: featuredQuote.user_name
      },
      tags: featuredQuote.tag_names ? featuredQuote.tag_names.split(',').map((name: string, index: number) => ({
        name,
        color: featuredQuote.tag_colors.split(',')[index]
      })) : []
    }
    
    return {
      success: true,
      data: transformedQuote
    }
  } catch (error) {
    console.error('Error fetching featured quote:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch featured quote'
    })
  }
})
