export default defineEventHandler(async (event) => {
  try {
    const referenceId = getRouterParam(event, 'id')
    if (!referenceId || isNaN(parseInt(referenceId))) throwServer(400, 'Invalid reference ID')

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

    if (!reference) { throwServer(404, 'Reference not found'); return }

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
    if ((error as any).statusCode) throw error
    throwServer(500, 'Failed to fetch reference')
  }
})
