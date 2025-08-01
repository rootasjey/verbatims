/**
 * Admin API: Data Management Export (Legacy - Deprecated)
 * This endpoint is deprecated and will be removed in a future version.
 * Use the new export endpoints under /api/admin/export/ instead.
 */

export default defineEventHandler(async (_event) => {
  throw createError({
    statusCode: 410,
    statusMessage: 'This export endpoint has been deprecated. Please use /api/admin/export/references instead.'
  })
})


