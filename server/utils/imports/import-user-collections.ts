import { db, schema } from 'hub:db'
import type { ImportOptions } from '~~/server/types'


export async function importUserCollectionsInline(importId: string, data: any[], options?: ImportOptions, userId?: string): Promise<void> {
  if (!Array.isArray(data) || !data.length) return
  let success = 0, failed = 0
  const errors: string[] = []
  for (const row of data) {
    try {
      await db.insert(schema.userCollections)
        .values({
          id: row.id,
          userId: row.user_id,
          name: row.name,
          description: row.description || null,
          isPublic: !!row.is_public,
          createdAt: row.created_at || null,
        })
        .onConflictDoNothing()
        .run()
      success++
    } catch (e: any) {
      failed++
      errors.push(`Failed to insert user_collection (id=${row.id}, user_id=${row.user_id}, name=${row.name}): ${e.message}`)
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
