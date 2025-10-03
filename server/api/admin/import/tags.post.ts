import type { ImportOptions } from '~/types'
import { createAdminImport, getAdminImport, updateAdminImport, addAdminImportError } from '~/server/utils/admin-import-progress'
import { processImportTags } from '~/server/utils/imports/import-tags'
import { scheduleBackground } from '~/server/utils/schedule'

/**
 * Admin API: Import Tags (JSON/CSV/XML)
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
    createAdminImport(importId, { status: 'pending', dataType: 'tags', filename })

    // Log import start (best-effort)
    try {
      const db = hubDatabase()
      await db.prepare(`INSERT INTO import_logs (import_id, filename, format, data_type, status, user_id, options) VALUES (?, ?, ?, ?, ?, ?, ?)`)
        .bind(importId, filename || null, (format || 'json'), 'tags', 'pending', user.id, JSON.stringify(options || {})).run()
    } catch (e) {
      console.warn('Failed to log tags import start:', e)
    }

    // Process async (schedule with Cloudflare waitUntil when available)
    const runJob = () =>
      processImportTags(importId, data, format, options).catch((err) => {
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
      message: 'Tags import started',
      progressUrl: `/api/admin/import/progress/${importId}`
    }
  } catch (error: any) {
    throwServer(error.statusCode || 500, error.statusMessage || 'Import tags failed')
  }
})
