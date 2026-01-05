import { db, schema } from 'hub:db'
import type { ImportOptions } from '~~/server/types'

export async function importQuoteViewsInline(importId: string, data: any[], options?: ImportOptions): Promise<void> {
  if (!Array.isArray(data) || !data.length) return
  let success = 0, failed = 0
  const errors: string[] = []
  for (const row of data) {
    try {
      await db.insert(schema.quoteViews)
        .values({
          id: row.id,
          quoteId: row.quote_id,
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
      errors.push(`Failed to insert quote_view (id=${row.id}, quote_id=${row.quote_id}): ${e.message}`)
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
