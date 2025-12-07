export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireUserSession(event)
    if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
      throw createError({ statusCode: 403, statusMessage: 'Admin or moderator access required' })
    }

    const referenceId = getRouterParam(event, 'id')
    if (!referenceId || isNaN(parseInt(referenceId))) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid reference ID' })
    }

    const db = hubDatabase()

    const reference = await db.prepare(`
      SELECT 
        r.*,
        COUNT(q.id) as quotes_count
      FROM quote_references r
      LEFT JOIN quotes q ON r.id = q.reference_id
      WHERE r.id = ?
      GROUP BY r.id
    `).bind(referenceId).first()

    if (!reference) {
      throw createError({ statusCode: 404, statusMessage: 'Reference not found' })
    }

    const transformed = {
      ...reference,
      urls: reference.urls ? JSON.parse(reference.urls as string) : []
    }

    return { success: true, data: transformed }
  } catch (error: any) {
    if ((error as any).statusCode) throw error
    console.error('Error fetching admin reference details:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch reference' })
  }
})
