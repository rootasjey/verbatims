/**
 * Import source files and reports are not database snapshots. Keep this route
 * as an explicit refusal so older clients cannot accidentally restore an
 * import payload as if it were a full database backup.
 */
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  throwServer(409, 'Import source files and reports are not database snapshots and cannot be used for rollback.')
})
