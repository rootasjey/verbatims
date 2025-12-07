import type { ImportOptions } from '~/types'
import type { createAdminImport, getAdminImport, updateAdminImport, addAdminImportError } from '~/types''~/server/utils/admin-import-progress'
import type { processImportUsers } from '~/types''~/server/utils/imports/import-users'
import type { scheduleBackground } from '~/types''~/server/utils/schedule'

/**
 * Admin API: Import Users (JSON/CSV/XML)
 */
export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireUserSession(event)
    if (!user || user.role !== 'admin') throwServer(403, 'Admin access required')

    const body = await readBody(event)
    const { data, format, options = {}, filename } = body as { data: any, format: 'json'|'csv'|'xml', options?: ImportOptions, filename?: string }

    if (!data) throwServer(400, 'No data provided for import')
    const importId = `import_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`

    // Initialize progress
    createAdminImport(importId, { status: 'pending', dataType: 'users', filename })

    // Log import start (best-effort)
    try {
      const db = hubDatabase()
      await db.prepare(`INSERT INTO import_logs (import_id, filename, format, data_type, status, user_id, options) VALUES (?, ?, ?, ?, ?, ?, ?)`)
        .bind(importId, filename || null, (format || 'json'), 'users', 'pending', user.id, JSON.stringify(options || {})).run()
    } catch (e) {
      console.warn('Failed to log users import start:', e)
    }

    // Process async (schedule with Cloudflare waitUntil when available)
    const runJob = () =>
      processImportUsers(importId, data, format, options, user.id).catch((err) => {
        addAdminImportError(importId, `Fatal error: ${err.message}`)
        try {
          const db = hubDatabase()
          const p = getAdminImport(importId)!
          db.prepare(`UPDATE import_logs SET status=?, record_count=?, successful_count=?, failed_count=?, warnings_count=?, completed_at=CURRENT_TIMESTAMP WHERE import_id=?`)
            .bind('failed', p.totalRecords, p.successfulRecords, p.failedRecords, p.warnings.length, importId).run()
        } catch {}
      })

    scheduleBackground(event, runJob)

    return {
      success: true,
      importId,
      message: 'Users import started',
      progressUrl: `/api/admin/import/progress/${importId}`
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    throwServer(500, 'Import users failed')
  }
})


