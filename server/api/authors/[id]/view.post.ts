export default defineEventHandler(async (event) => {
  try {
    const authorId = getRouterParam(event, 'id')
    if (!authorId || isNaN(parseInt(authorId))) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid author ID'
      })
    }

    const db = hubDatabase()

    // Ensure author exists
    const author = await db.prepare(`SELECT id FROM authors WHERE id = ?`).bind(authorId).first()
    if (!author) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Author not found'
      })
    }

    // Increment views_count directly (no deduplication table for authors)
    await db.prepare(`
      UPDATE authors SET views_count = views_count + 1 WHERE id = ?
    `).bind(authorId).run()

    return {
      success: true,
      message: 'Author view tracked'
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }

    console.error('Error tracking author view:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to track author view'
    })
  }
})
