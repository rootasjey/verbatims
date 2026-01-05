import { db, schema } from 'hub:db'
import type { ImportOptions } from '~~/server/types'

export async function importUserSessionsInline(importId: string, data: any[], options?: ImportOptions, userId?: string): Promise<void> {
  if (!Array.isArray(data) || !data.length) return
  let success = 0, failed = 0
  const errors: string[] = []
  for (const row of data) {
    try {
      await db.insert(schema.userSessions)
        .values({
          userId: row.user_id,
          sessionToken: row.session_token,
          createdAt: row.created_at || null,
          expiresAt: row.expires_at || null,
        })
        .onConflictDoNothing()
        .run()
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
