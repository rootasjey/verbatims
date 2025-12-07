export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!session.user || !['admin', 'moderator'].includes(session.user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }

  try {
    const body = await readBody(event)
    const name = String(body?.name || '').trim()
    const color = (body?.color as string) || '#687FE5'
    const description = (body?.description as string) || null
    const category = (body?.category as string) || null
    if (!name || name.length < 2) {
      throw createError({ statusCode: 400, statusMessage: 'Tag name is required' })
    }

    const db = hubDatabase()
    const exists = await db.prepare(`
      SELECT id FROM tags WHERE LOWER(name) = LOWER(?)
    `).bind(name).first()
    
    if (exists) { throw createError({ statusCode: 409, statusMessage: 'Tag with this name already exists' }) }

    const result = await db.prepare(`
      INSERT INTO tags (name, description, category, color)
      VALUES (?, ?, ?, ?)
    `)
    .bind(name, description, category, color)
    .run()

    const created = await db.prepare(`
      SELECT id, name, description, category, color, created_at, updated_at
      FROM tags
      WHERE id = ?
    `)
    .bind(result.meta.last_row_id)
    .first()

    return { success: true, data: created }
  } catch (error: any) {
    if ((error as any).statusCode) throw error
    console.error('Error creating tag:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to create tag' })
  }
})
