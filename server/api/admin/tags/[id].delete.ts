export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!session.user || !['admin', 'moderator'].includes(session.user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }

  try {
    const id = getRouterParam(event, 'id')
    if (!id || isNaN(parseInt(id))) throw createError({ statusCode: 400, statusMessage: 'Invalid tag ID' })

    const db = hubDatabase()
    // Optionally, we could check usage count and return it
    const usageRow = await db.prepare('SELECT COUNT(*) as count FROM quote_tags WHERE tag_id = ?').bind(id).first()
    const usage = Number(usageRow?.count || 0)

    await db.prepare('DELETE FROM tags WHERE id = ?').bind(id).run()

    return { success: true, data: { deleted: true, usage } }
  } catch (error: any) {
    if ((error as any).statusCode) throw error
    console.error('Error deleting tag:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to delete tag' })
  }
})
