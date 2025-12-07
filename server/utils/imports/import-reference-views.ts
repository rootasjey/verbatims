import type { ImportOptions } from '~/types'
import { getAdminImport, updateAdminImport } from '~/server/utils/admin-import-progress'

export async function importReferenceViewsInline(importId: string, data: any[], options?: ImportOptions): Promise<void> {
  if (!Array.isArray(data) || !data.length) return
  const db = hubDatabase()
  let success = 0, failed = 0
  const errors: string[] = []
  for (const row of data) {
    try {
      await db.prepare('INSERT OR IGNORE INTO reference_views (id, reference_id, user_id, viewed_at, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?)')
        .bind(row.id, row.reference_id, row.user_id || null, row.viewed_at || null, row.ip_address || null, row.user_agent || null).run()
      success++
    } catch (e: any) {
      failed++
      errors.push(`Failed to insert reference_view (id=${row.id}, reference_id=${row.reference_id}): ${e.message}`)
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
