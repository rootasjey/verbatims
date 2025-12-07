import type { ImportOptions } from '~/types'

import type { getAdminImport, updateAdminImport } from '~/types''~/server/utils/admin-import-progress'

export async function importQuoteTagsInline(importId: string, data: any[], options?: ImportOptions): Promise<void> {
  if (!Array.isArray(data) || !data.length) return
  const db = hubDatabase()
  let success = 0, failed = 0
  const errors: string[] = []
  for (const row of data) {
    try {
      await db.prepare('INSERT OR IGNORE INTO quote_tags (quote_id, tag_id) VALUES (?, ?)')
        .bind(row.quote_id, row.tag_id).run()
      success++
    } catch (e: any) {
      failed++
      errors.push(`Failed to insert quote_tag (quote_id=${row.quote_id}, tag_id=${row.tag_id}): ${e.message}`)
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
