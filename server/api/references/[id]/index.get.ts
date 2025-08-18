export default defineEventHandler(async (event) => {
  try {
    const referenceId = getRouterParam(event, 'id')
    if (!referenceId || isNaN(parseInt(referenceId))) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid reference ID'
      })
    }

    const db = hubDatabase()

    // Fetch reference with quote count
    const reference = await db.prepare(`
      SELECT 
        r.*,
        COUNT(q.id) as quotes_count
      FROM quote_references r
      LEFT JOIN quotes q ON r.id = q.reference_id AND q.status = 'approved'
      WHERE r.id = ?
      GROUP BY r.id
    `).bind(referenceId).first()

    if (!reference) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Reference not found'
      })
    }

    // Parse JSON fields
    const transformedReference = {
      ...reference,
      urls: reference.urls ? JSON.parse(reference.urls as string) : []
    }

    return {
      success: true,
      data: transformedReference
    }
  } catch (error: any) {
    console.error('Error fetching reference:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch reference'
    })
  }
})
