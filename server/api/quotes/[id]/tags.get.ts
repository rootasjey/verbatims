export default defineEventHandler(async (event) => {
  try {
    const quoteId = getRouterParam(event, 'id')
    if (!quoteId || isNaN(parseInt(quoteId))) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid quote ID' })
    }

    const db = hubDatabase()
    const rows = await db.prepare(`
      SELECT t.id, t.name, t.color
      FROM quote_tags qt
      JOIN tags t ON t.id = qt.tag_id
      WHERE qt.quote_id = ?
      ORDER BY t.name ASC
    `).bind(quoteId).all()

    return { success: true, data: rows }
  } catch (error) {
    console.error('Error fetching quote tags:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch quote tags' })
  }
})
