import { db, schema } from 'hub:db'
import { sql, eq, and } from 'drizzle-orm'
import type { CreatedQuoteResult } from "~/types"

export default defineEventHandler(async (event) => {
  try {
    const session = await requireUserSession(event)
    if (!session.user) {
      throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
    }
    if (session.user.role !== 'admin' && session.user.role !== 'moderator') {
      throw createError({ statusCode: 403, statusMessage: 'Admin or moderator access required' })
    }

    const quoteId = getRouterParam(event, 'id')
    if (!quoteId || isNaN(parseInt(quoteId))) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid quote ID' })
    }

    // Ensure the quote exists and is a draft (admin/mods can submit any draft)
    const quote = await db.select()
      .from(schema.quotes)
      .where(and(
        eq(schema.quotes.id, parseInt(quoteId)),
        eq(schema.quotes.status, 'draft')
      ))
      .get()

    if (!quote) {
      throw createError({ statusCode: 404, statusMessage: 'Quote not found or not a draft' })
    }

    // Minimal validation similar to user submit: require some content
    if (!quote.name || String(quote.name).trim().length < 10) {
      throw createError({ statusCode: 400, statusMessage: 'Quote must have at least 10 characters before submission' })
    }

    // Move quote to pending
    await db.update(schema.quotes)
      .set({ 
        status: 'pending',
        updatedAt: sql`CURRENT_TIMESTAMP`
      })
      .where(eq(schema.quotes.id, parseInt(quoteId)))
      .run()

    // Fetch updated quote with relations (same shape as other endpoints)
    const updatedQuote = await db.get<CreatedQuoteResult>(sql.raw(`
      SELECT 
        q.*,
        a.name as author_name,
        a.is_fictional as author_is_fictional,
        a.image_url as author_image_url,
        r.name as reference_name,
        r.primary_type as reference_type,
        u.name as user_name,
        u.email as user_email,
        u.avatar_url as user_avatar_url,
        m.name as moderator_name,
        GROUP_CONCAT(t.name) as tag_names,
        GROUP_CONCAT(t.color) as tag_colors
      FROM ${schema.quotes._.name} q
      LEFT JOIN ${schema.authors._.name} a ON q.author_id = a.id
      LEFT JOIN ${schema.quoteReferences._.name} r ON q.reference_id = r.id
      LEFT JOIN ${schema.users._.name} u ON q.user_id = u.id
      LEFT JOIN ${schema.users._.name} m ON q.moderator_id = m.id
      LEFT JOIN ${schema.quoteTags._.name} qt ON q.id = qt.quote_id
      LEFT JOIN ${schema.tags._.name} t ON qt.tag_id = t.id
      WHERE q.id = ${parseInt(quoteId)}
      GROUP BY q.id
    `))

    if (!updatedQuote) {
      throw createError({ statusCode: 500, statusMessage: 'Failed to fetch updated quote' })
    }

    const processedQuote = {
      ...updatedQuote,
      tags: updatedQuote.tag_names
        ? updatedQuote.tag_names.split(',').map((name, index) => ({
            name,
            color: updatedQuote.tag_colors?.split(',')[index] || 'gray'
          }))
        : []
    }

    return {
      success: true,
      data: processedQuote,
      message: 'Quote submitted successfully and is now pending moderation'
    }
  } catch (error: any) {
    if ((error as any).statusCode) {
      throw error
    }
    console.error('Admin submit quote error:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to submit quote for review' })
  }
})
