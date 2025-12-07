import type { ImportOptions } from '~/types'
import { getAdminImport, updateAdminImport } from '~/server/utils/admin-import-progress'

export async function importUserLikesInline(importId: string, data: any[], options?: ImportOptions, userId?: string): Promise<void> {
  if (!Array.isArray(data) || !data.length) return
  const db = hubDatabase()
  let success = 0, failed = 0
  const errors: string[] = []
  for (const row of data) {
    try {
      await db.prepare('INSERT OR IGNORE INTO user_likes (user_id, likeable_type, likeable_id, created_at) VALUES (?, ?, ?, ?)')
        .bind(row.user_id, row.likeable_type, row.likeable_id, row.created_at || null).run()
      success++
    } catch (e: any) {
      failed++
      errors.push(`Failed to insert user_like (user_id=${row.user_id}, likeable_type=${row.likeable_type}, likeable_id=${row.likeable_id}): ${e.message}`)
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
