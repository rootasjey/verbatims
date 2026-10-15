import { and, eq, inArray } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { deleteBackup } from '../../../utils/backup-storage'

const finishedStatuses = ['completed', 'failed'] as const

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const body = await readBody<{ confirm?: boolean }>(event)
  if (body?.confirm !== true) throwServer(400, 'Explicit confirmation is required.')

  let deletedImports = 0
  const failedImports: string[] = []
  const pageSize = 25

  // Process a bounded batch at a time. Active imports are never selected;
  // failed storage deletion leaves that import log available for retry.
  while (true) {
    const importLogs = await db.select({
      id: schema.importLogs.id,
      importId: schema.importLogs.importId,
    })
      .from(schema.importLogs)
      .where(inArray(schema.importLogs.status, finishedStatuses))
      .orderBy(schema.importLogs.id)
      .limit(pageSize)
      .all()

    if (importLogs.length === 0) break

    for (const importLog of importLogs) {
      try {
        const backups = await db.select({ id: schema.backupFiles.id })
          .from(schema.backupFiles)
          .where(eq(schema.backupFiles.importLogId, importLog.id))
          .all()

        for (const backup of backups) await deleteBackup(backup.id)

        const deleted = await db.delete(schema.importLogs)
          .where(and(
            eq(schema.importLogs.id, importLog.id),
            inArray(schema.importLogs.status, finishedStatuses),
          ))
          .returning({ id: schema.importLogs.id })
          .get()

        if (!deleted) throw new Error('Import history was no longer eligible for deletion.')
        deletedImports++
      } catch (error) {
        console.error(`Failed to clear import history ${importLog.importId}:`, error)
        failedImports.push(importLog.importId)
      }
    }

    // Avoid retrying failed entries forever in this request; all entries in
    // this snapshot have now either been removed or retained for a later retry.
    if (failedImports.length > 0) {
      const remaining = await db.select({ id: schema.importLogs.id })
        .from(schema.importLogs)
        .where(inArray(schema.importLogs.status, finishedStatuses))
        .limit(1)
        .all()
      if (remaining.length > 0) break
    }
  }

  return {
    success: failedImports.length === 0,
    data: {
      deletedImports,
      failedImports,
    },
  }
})
