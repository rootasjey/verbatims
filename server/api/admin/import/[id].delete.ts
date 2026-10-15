import { and, eq, inArray } from 'drizzle-orm'
import { db, schema } from 'hub:db'
import { deleteBackup } from '../../../utils/backup-storage'

const finishedStatuses = ['completed', 'failed'] as const

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const importId = getRouterParam(event, 'id')
  if (!importId) throwServer(400, 'Import ID is required')

  const importLog = await db.select({ id: schema.importLogs.id, status: schema.importLogs.status })
    .from(schema.importLogs)
    .where(eq(schema.importLogs.importId, importId))
    .get()

  if (!importLog) throwServer(404, 'Import history entry not found')
  if (!finishedStatuses.includes(importLog.status as typeof finishedStatuses[number])) {
    throwServer(409, 'An import can only be deleted after it has finished.')
  }

  const backups = await db.select({ id: schema.backupFiles.id })
    .from(schema.backupFiles)
    .where(eq(schema.backupFiles.importLogId, importLog.id))
    .all()

  // Remove archived source/report objects first. If storage deletion fails,
  // keep the import log so the remaining cleanup can be retried.
  for (const backup of backups) await deleteBackup(backup.id)

  const deleted = await db.delete(schema.importLogs)
    .where(and(
      eq(schema.importLogs.id, importLog.id),
      inArray(schema.importLogs.status, finishedStatuses),
    ))
    .returning({ id: schema.importLogs.id })
    .get()

  if (!deleted) throwServer(409, 'The import is no longer eligible for deletion.')

  return { success: true, data: { deleted: 1 } }
})
