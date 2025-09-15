import type { ImportOptions } from '~/types'

import { getAdminImport, updateAdminImport } from '~/server/utils/admin-import-progress'

export async function importCollectionQuotesInline(importId: string, data: any[], options?: ImportOptions): Promise<void> {
  if (!Array.isArray(data) || !data.length) return
  const db = hubDatabase()
  let success = 0, failed = 0
  const errors: string[] = []
  for (const row of data) {
    try {
      await db.prepare('INSERT OR IGNORE INTO collection_quotes (collection_id, quote_id, added_at) VALUES (?, ?, ?)')
        .bind(row.collection_id, row.quote_id, row.added_at || null).run()
      success++
    } catch (e: any) {
      failed++
      errors.push(`Failed to insert collection_quote (collection_id=${row.collection_id}, quote_id=${row.quote_id}): ${e.message}`)
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
