export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!session.user || !['admin', 'moderator'].includes(session.user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }

  const id = getRouterParam(event, 'id')
  if (!id || isNaN(parseInt(id))) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid tag ID' })
  }

  try {
    const db = hubDatabase()
    const sql = `
      SELECT t.id, t.name, t.description, t.category, t.color, t.created_at, t.updated_at,
             COUNT(qt.quote_id) as quotes_count
      FROM tags t
      LEFT JOIN quote_tags qt ON t.id = qt.tag_id
      WHERE t.id = ?
      GROUP BY t.id
    `
    const row = await db.prepare(sql).bind(id).first()
    if (!row) throw createError({ statusCode: 404, statusMessage: 'Tag not found' })

    return { success: true, data: row }
  } catch (error: any) {
    if ((error as any).statusCode) throw error
    console.error('Error fetching tag by id:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch tag' })
  }
})
