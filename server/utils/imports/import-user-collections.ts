import type { ImportOptions } from '~/types'

import type { getAdminImport, updateAdminImport } from '~/types''~/server/utils/admin-import-progress'

export async function importUserCollectionsInline(importId: string, data: any[], options?: ImportOptions, userId?: string): Promise<void> {
  if (!Array.isArray(data) || !data.length) return
  const db = hubDatabase()
  let success = 0, failed = 0
  const errors: string[] = []
  for (const row of data) {
    try {
      await db.prepare('INSERT OR IGNORE INTO user_collections (id, user_id, name, description, is_public, created_at) VALUES (?, ?, ?, ?, ?, ?)')
        .bind(row.id, row.user_id, row.name, row.description || null, !!row.is_public, row.created_at || null).run()
      success++
    } catch (e: any) {
      failed++
      errors.push(`Failed to insert user_collection (id=${row.id}, user_id=${row.user_id}, name=${row.name}): ${e.message}`)
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
