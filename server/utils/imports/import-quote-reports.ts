import type { ImportOptions } from '~/types'
import { getAdminImport, updateAdminImport } from '~/server/utils/admin-import-progress'
import { db, schema } from 'hub:db'
import { sql } from 'drizzle-orm'

export async function importQuoteReportsInline(importId: string, data: any[], options?: ImportOptions): Promise<void> {
  if (!Array.isArray(data) || !data.length) return
  let success = 0, failed = 0
  const errors: string[] = []
  for (const row of data) {
    try {
      await db.insert(schema.quoteReports)
        .values({
          id: row.id,
          quoteId: row.quote_id,
          userId: row.user_id,
          reason: row.reason || null,
          status: row.status || null,
          createdAt: row.created_at || null,
          reviewedAt: row.reviewed_at || null,
          reviewerId: row.reviewer_id || null,
          notes: row.notes || null,
        })
        .onConflictDoNothing()
        .run()
      success++
    } catch (e: any) {
      failed++
      errors.push(`Failed to insert quote_report (id=${row.id}, quote_id=${row.quote_id}): ${e.message}`)
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
