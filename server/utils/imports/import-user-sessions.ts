import type { ImportOptions } from '~/types'

import type { getAdminImport, updateAdminImport } from '~/types''~/server/utils/admin-import-progress'

export async function importUserSessionsInline(importId: string, data: any[], options?: ImportOptions, userId?: string): Promise<void> {
  if (!Array.isArray(data) || !data.length) return
  const db = hubDatabase()
  let success = 0, failed = 0
  const errors: string[] = []
  for (const row of data) {
    try {
      await db.prepare('INSERT OR IGNORE INTO user_sessions (id, user_id, session_token, created_at, expires_at, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .bind(row.id, row.user_id, row.session_token, row.created_at || null, row.expires_at || null, row.ip_address || null, row.user_agent || null).run()
      success++
    } catch (e: any) {
      failed++
      errors.push(`Failed to insert user_session (id=${row.id}, user_id=${row.user_id}): ${e.message}`)
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
