/**
 * Admin API: Cancel Import
 */

import { getAdminImport, requestCancel } from '~/server/utils/admin-import-progress'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  if (!user || user.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }

  const importId = getRouterParam(event, 'id')
  if (!importId) {
    throw createError({ statusCode: 400, statusMessage: 'Import ID is required' })
  }

  const progress = getAdminImport(importId)
  if (!progress) {
    throw createError({ statusCode: 404, statusMessage: 'Import not found' })
  }

  requestCancel(importId)

  return { success: true, message: 'Cancellation requested' }
})

