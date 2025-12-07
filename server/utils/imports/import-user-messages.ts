import type { ImportOptions } from '~/types'

import { getAdminImport, updateAdminImport } from '~/server/utils/admin-import-progress'

export async function importUserMessagesInline(importId: string, data: any[], options?: ImportOptions, userId?: string): Promise<void> {
  if (!Array.isArray(data) || !data.length) return
  const db = hubDatabase()
  let success = 0, failed = 0
  const errors: string[] = []
  for (const row of data) {
    try {
      await db.prepare('INSERT OR IGNORE INTO user_messages (id, user_id, message, created_at, read_at) VALUES (?, ?, ?, ?, ?)')
        .bind(row.id, row.user_id, row.message, row.created_at || null, row.read_at || null).run()
      success++
    } catch (e: any) {
      failed++
      errors.push(`Failed to insert user_message (id=${row.id}, user_id=${row.user_id}): ${e.message}`)
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
