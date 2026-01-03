import type { ImportOptions } from '~/types'
import { createAdminImport, getAdminImport, updateAdminImport, addAdminImportError } from '~/server/utils/admin-import-progress'
import { processImportQuotes } from '~/server/utils/imports/import-quotes'
import { scheduleBackground } from '~/server/utils/schedule'
import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'

/**
 * Admin API: Import Quotes (JSON/CSV/XML)
 */
export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireUserSession(event)
    if (!user || user.role !== 'admin') throwServer(403, 'Admin access required')

    const body = await readBody(event)
    const { data, format, options = {}, filename } = body as { data: any, format: 'json'|'csv'|'xml', options?: ImportOptions, filename?: string }

    if (!data) { throwServer(400, 'No data provided for import') }
    const importId = `import_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`

    // Initialize progress
    createAdminImport(importId, { status: 'pending', dataType: 'quotes', filename })

    // Log import start (best-effort)
    try {
      await db.insert(schema.importLogs).values({
        importId,
        filename: filename || null,
        format: format || 'json',
        dataType: 'quotes',
        status: 'pending',
        userId: user.id,
        options: JSON.stringify(options || {})
      })
    } catch (e) {
      console.warn('Failed to log quotes import start:', e)
    }

    // Process async (schedule with Cloudflare waitUntil when available)
    const runJob = () =>
      processImportQuotes(importId, data, format, options, user.id).catch((err) => {
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

    return { success: true, importId, message: 'Quotes import started', progressUrl: `/api/admin/import/progress/${importId}` }
  } catch (error: any) {
    if ((error as any).statusCode) throw error
    throwServer(500, 'Import quotes failed')
  }
})


