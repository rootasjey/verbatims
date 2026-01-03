import { db, schema } from 'hub:db'
import { eq, and, sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const quoteId = getRouterParam(event, 'id')
    if (!quoteId || isNaN(parseInt(quoteId))) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid quote ID'
      })
    }

    // Check if quote exists and is approved
    const quote = await db.select({ 
      id: schema.quotes.id, 
      sharesCount: schema.quotes.sharesCount 
    })
      .from(schema.quotes)
      .where(and(
        eq(schema.quotes.id, parseInt(quoteId)),
        eq(schema.quotes.status, 'approved')
      ))
      .get()

    if (!quote) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Quote not found or not approved'
      })
    }

    // Increment share count
    await db.update(schema.quotes)
      .set({ sharesCount: sql`${schema.quotes.sharesCount} + 1` })
      .where(eq(schema.quotes.id, parseInt(quoteId)))

    // Get updated share count
    const updatedQuote = await db.select({ sharesCount: schema.quotes.sharesCount })
      .from(schema.quotes)
      .where(eq(schema.quotes.id, parseInt(quoteId)))
      .get()

    if (!updatedQuote) {
      throw createError({ statusCode: 500, statusMessage: 'Failed to update quote share count' })
    }

    return {
      success: true,
      data: {
        sharesCount: updatedQuote.sharesCount
      }
    }
  } catch (error) {
    if ((error as any).statusCode) {
      throw error
    }
    
    console.error('Error tracking share:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to track share'
    })
  }
})
