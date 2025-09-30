import { createAdminImport, getAdminImport, addAdminImportError } from '~/server/utils/admin-import-progress'
import { processImportReferences } from '~/server/utils/imports/import-references'
import { scheduleBackground } from '~/server/utils/schedule'

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireUserSession(event)
    if (user.role !== 'admin') { throw createError({ statusCode: 403, statusMessage: 'Admin access required' }) }

    const body = await readBody(event)
    const { data, format, options = {}, filename } = body
    if (!data) { throw createError({ statusCode: 400, statusMessage: 'No data provided for import' }) }

    const importId = `import_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    createAdminImport(importId, { status: 'pending', dataType: 'references', filename })

    // Persist snapshot to import_logs (best-effort)
    try {
      const db = hubDatabase()
      await db.prepare(`
        INSERT INTO import_logs (import_id, filename, format, data_type, status, user_id, options) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        importId,
        filename || null,
        (format || 'json'),
        'references',
        'pending',
        user.id,
        JSON.stringify(options || {})
      )
      .run()
    } catch (e) { console.warn('Failed to log import start:', e) }

    const runJob = () =>
      processImportReferences(importId, data, format, options).catch((err) => {
        addAdminImportError(importId, `Fatal error: ${err.message}`)
        try {
          const db = hubDatabase()
          const p = getAdminImport(importId)!
          db.prepare(`
            UPDATE import_logs SET status=?, record_count=?, successful_count=?, failed_count=?, warnings_count=?, completed_at=CURRENT_TIMESTAMP 
            WHERE import_id=?
          `)
          .bind(
            'failed',
            p.totalRecords,
            p.successfulRecords,
            p.failedRecords,
            p.warnings.length,
            importId
          )
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
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Import failed',
    })
  }
})
