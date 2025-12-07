import type { ImportOptions } from '~/types'

import type { getAdminImport, updateAdminImport } from '~/types''~/server/utils/admin-import-progress'

export async function importQuoteReportsInline(importId: string, data: any[], options?: ImportOptions): Promise<void> {
  if (!Array.isArray(data) || !data.length) return
  const db = hubDatabase()
  let success = 0, failed = 0
  const errors: string[] = []
  for (const row of data) {
    try {
      await db.prepare('INSERT OR IGNORE INTO quote_reports (id, quote_id, user_id, reason, status, created_at, reviewed_at, reviewer_id, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .bind(row.id, row.quote_id, row.user_id, row.reason || null, row.status || null, row.created_at || null, row.reviewed_at || null, row.reviewer_id || null, row.notes || null).run()
      success++
    } catch (e: any) {
      failed++
      errors.push(`Failed to insert quote_report (id=${row.id}, quote_id=${row.quote_id}): ${e.message}`)
    }
  }
  // Update progress/errors
  const p = getAdminImport(importId)
  if (p) {
    updateAdminImport(importId, {
      successfulRecords: (p.successfulRecords || 0) + success,
      failedRecords: (p.failedRecords || 0) + failed,
      errors: [...(p.errors || []), ...errors],
    })
  }
}
