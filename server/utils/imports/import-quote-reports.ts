import { db, schema } from 'hub:db'
import type { ImportOptions } from '~~/server/types'

export async function importQuoteReportsInline(importId: string, data: any[], options?: ImportOptions): Promise<void> {
  if (!Array.isArray(data) || !data.length) return
  let success = 0, failed = 0
  const errors: string[] = []
  for (const row of data) {
    try {
      await db.insert(schema.quoteReports)
        .values({
          quoteId: row.quote_id,
          reporterId: row.reporter_id,
          reason: row.reason || null,
          description: row.description || null,
          status: row.status || null,
          createdAt: row.created_at || null,
          reviewedAt: row.reviewed_at || null,
          reviewedBy: row.reviewed_by || null,
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
