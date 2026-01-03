import type { ImportOptions } from '~/types'
import { getAdminImport, updateAdminImport } from '~/server/utils/admin-import-progress'
import { db, schema } from 'hub:db'
import { sql } from 'drizzle-orm'

export async function importAuthorViewsInline(importId: string, data: any[], options?: ImportOptions): Promise<void> {
  if (!Array.isArray(data) || !data.length) return
  let success = 0, failed = 0
  const errors: string[] = []
  for (const row of data) {
    try {
      await db.insert(schema.authorViews)
        .values({
          id: row.id,
          authorId: row.author_id,
          userId: row.user_id || null,
          viewedAt: row.viewed_at || null,
          ipAddress: row.ip_address || null,
          userAgent: row.user_agent || null,
        })
        .onConflictDoNothing()
        .run()
      success++
    } catch (e: any) {
      failed++
      errors.push(`Failed to insert author_view (id=${row.id}, author_id=${row.author_id}): ${e.message}`)
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
