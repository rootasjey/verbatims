import type { ProcessedQuoteResult } from "~/types"
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
    const quote = await db.prepare(`
      SELECT 
        q.*,
        a.name as author_name,
        a.is_fictional as author_is_fictional,
        a.image_url as author_image_url,
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
      WHERE q.id = ? AND q.status = 'approved'
      GROUP BY q.id
    `).bind(quoteId).first()

    if (!quote) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Quote not found'
      })
    }

    const transformedQuote = {
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
        is_fictional: quote.author_is_fictional,
        image_url: quote.author_image_url
      } : undefined,
      reference: quote.reference_id ? {
        id: quote.reference_id,
        name: quote.reference_name,
        primary_type: quote.reference_type
      } : undefined,
      user: {
        id: quote.user_id,
        name: quote.user_name
      },
      tags: typeof quote.tag_names === 'string' ? quote.tag_names.split(',').map((name, index) => ({
        name,
        color: typeof quote.tag_colors === 'string' ? quote.tag_colors.split(',')[index] : undefined
      })) : []
    }

    return {
      success: true,
      data: transformedQuote as unknown as ProcessedQuoteResult
    }
  } catch (error: any) {
    if ((error as any).statusCode) throw error
    
    console.error('Error fetching quote:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch quote'
    })
  }
})
