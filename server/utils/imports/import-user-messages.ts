import { db, schema } from 'hub:db'
import type { ImportOptions } from '~~/server/types'

export async function importUserMessagesInline(importId: string, data: any[], options?: ImportOptions, userId?: string): Promise<void> {
  if (!Array.isArray(data) || !data.length) return
  let success = 0, failed = 0
  const errors: string[] = []
  for (const row of data) {
    try {
      await db.insert(schema.userMessages)
        .values({
          userId: row.user_id || null,
          name: row.name || null,
          email: row.email || null,
          category: row.category,
          tags: row.tags || '[]',
          message: row.message,
          targetType: row.target_type || 'general',
          targetId: row.target_id || null,
          ipAddress: row.ip_address || null,
          userAgent: row.user_agent || null,
          status: row.status || 'new',
          reviewedBy: row.reviewed_by || null,
          reviewedAt: row.reviewed_at || null,
          createdAt: row.created_at || null,
        })
        .onConflictDoNothing()
        .run()
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
