/**
 * Admin API: List Backup Files
 * Provides comprehensive backup file listing with filtering and pagination
 */
export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireUserSession(event)
    if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
      throw createError({ statusCode: 403, statusMessage: 'Admin or moderator access required' })
    }

    const query = getQuery(event)
    const page = parseInt(query.page as string) || 1
    const limit = parseInt(query.limit as string) || 20
    const status = query.status as BackupStorageStatus | undefined
    const dataType = query.dataType as string | undefined
    const dateFrom = query.dateFrom as string | undefined
    const dateTo = query.dateTo as string | undefined

    const result = await listBackupFiles({
      page,
      limit,
      status,
      dataType,
      dateFrom,
      dateTo
    })

    return {
      success: true,
      data: result
    }

  } catch (error: any) {
    console.error('List backup files error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to list backup files'
    })
  }
})
