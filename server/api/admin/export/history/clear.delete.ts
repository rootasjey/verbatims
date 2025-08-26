/**
 * Admin API: Clear All Export History
 * Deletes all export history entries with confirmation
 */
export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireUserSession(event)
    if (!user || user.role !== 'admin') {
      throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
    }

    const body = await readBody(event)
    const { confirm } = body

    if (!confirm) {
      throw createError({ statusCode: 400, statusMessage: 'Confirmation required to clear all export history' })
    }

    const db = hubDatabase()
    const countResult = await db.prepare(`
      SELECT COUNT(*) as total FROM export_logs
    `).first()

    const totalEntries = Number(countResult?.total) || 0

    if (totalEntries === 0) {
      return {
        success: true,
        message: 'No export history entries to clear',
        deletedCount: 0
      }
    }

    const result = await db.prepare(`
      DELETE FROM export_logs
    `).run()

    if (!result.success) {
      throw createError({ statusCode: 500, statusMessage: 'Failed to clear export history' })
    }

    return {
      success: true,
      message: `Successfully cleared ${totalEntries} export history entries`,
      deletedCount: totalEntries
    }

  } catch (error: any) {
    console.error('Clear export history error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to clear export history'
    })
  }
})
