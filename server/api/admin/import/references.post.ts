import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireUserSession(event)
    if (user.role !== 'admin') throwServer(403, 'Admin access required')

    const body = await readBody(event)
    const { data, format, options = {}, filename } = body
    if (!data) { throwServer(400, 'No data provided for import') }

    const importId = `import_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    createAdminImport(importId, { status: 'pending', dataType: 'references', filename })

    // Persist snapshot to import_logs (best-effort)
    try {
      await db.insert(schema.importLogs).values({
        importId,
        filename: filename || null,
        format: format || 'json',
        dataType: 'references',
        status: 'pending',
        userId: user.id,
        options: JSON.stringify(options || {})
      })
    } catch (e) { console.warn('Failed to log import start:', e) }

    const runJob = () =>
      processImportReferences(importId, data, format, options).catch((err) => {
        addAdminImportError(importId, `Fatal error: ${err.message}`)
        try {
          const p = getAdminImport(importId)!
          db.update(schema.importLogs)
            .set({
              status: 'failed',
              recordCount: p.totalRecords,
              successfulCount: p.successfulRecords,
              failedCount: p.failedRecords,
              warningsCount: p.warnings.length,
              completedAt: new Date()
            })
            .where(eq(schema.importLogs.importId, importId))
            .run()
        } catch {}
      })

    scheduleBackground(event, runJob)

    return {
      success: true,
      importId,
      message: 'Import started successfully',
      progressUrl: `/api/admin/import/progress/${importId}`,
    }
  } catch (error: any) {
    throwServer(error.statusCode || 500, error.statusMessage || 'Import failed')
  }
})
