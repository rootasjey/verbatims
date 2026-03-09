import { db, schema } from 'hub:db'
import type { ImportOptions } from '~~/server/types'
import { parseTimestampInput } from '~~/server/utils/date-normalization'

export async function importUserMessagesInline(importId: string, data: any[], options?: ImportOptions, userId?: string): Promise<void> {
  if (!Array.isArray(data) || !data.length) return
  let success = 0, failed = 0
  const errors: string[] = []
  for (const row of data) {
    try {
      const reviewedAt = parseTimestampInput(row.reviewed_at)
      const createdAt = parseTimestampInput(row.created_at) ?? new Date()

      await db.insert(schema.userMessages)
        .values({
          userId: row.user_id || null,
          name: row.name || null,
          email: row.email || null,
          category: row.category,
          tags: Array.isArray(row.tags) ? JSON.stringify(row.tags) : (row.tags || '[]'),
          message: row.message,
          targetType: row.target_type || 'general',
          targetId: row.target_id || null,
          ipAddress: row.ip_address || null,
          userAgent: row.user_agent || null,
          status: row.status || 'new',
          reviewedBy: row.reviewed_by || null,
          reviewedAt,
          createdAt,
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
