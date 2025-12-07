export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!session.user || !['admin', 'moderator'].includes(session.user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }

  try {
    const id = getRouterParam(event, 'id')
    if (!id || isNaN(parseInt(id))) throw createError({ statusCode: 400, statusMessage: 'Invalid tag ID' })
    const body = await readBody(event)

    const db = hubDatabase()
    const existing = await db.prepare('SELECT * FROM tags WHERE id = ?').bind(id).first()
    if (!existing) throw createError({ statusCode: 404, statusMessage: 'Tag not found' })

    // If updating name, ensure uniqueness (case-insensitive) excluding current ID
    if (typeof body.name === 'string' && body.name.trim()) {
      const nameTrimmed = body.name.trim()
      const conflict = await db
        .prepare('SELECT id FROM tags WHERE LOWER(name) = LOWER(?) AND id != ?')
        .bind(nameTrimmed, id)
        .first()

      if (conflict) { throw createError({ statusCode: 409, statusMessage: 'Tag with this name already exists' }) }
    }

    const updates: string[] = []
    const values: any[] = []
    if (typeof body.name === 'string' && body.name.trim()) { updates.push('name = ?'); values.push(body.name.trim()) }
    if (typeof body.description === 'string' || body.description === null) { updates.push('description = ?'); values.push(body.description ?? null) }
    if (typeof body.category === 'string' || body.category === null) { updates.push('category = ?'); values.push(body.category ?? null) }
    if (typeof body.color === 'string' && body.color.trim()) { updates.push('color = ?'); values.push(body.color.trim()) }

    if (!updates.length) return { success: true, data: existing }

    const sql = `UPDATE tags SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
    await db.prepare(sql).bind(...values, id).run()

    const updated = await db
      .prepare(`
        SELECT id, name, description, category, color, created_at, updated_at 
        FROM tags 
        WHERE id = ?
      `)
      .bind(id)
      .first()
    return { success: true, data: updated }
  } catch (error: any) {
    if ((error as any).statusCode) throw error
    console.error('Error updating tag:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to update tag' })
  }
})
