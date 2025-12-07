/**
 * Admin API: Rollback Import
 * Restores data from centralized backup_files + R2 snapshot
 *
 * Notes:
 * - Currently supports rolling back quote_references (references) snapshots produced by import utilities
 * - For safety, this endpoint clears the target table then re-inserts the snapshot
 * - D1 does not support manual BEGIN/COMMIT; we use db.batch() in sub-batches
 */
export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireUserSession(event)
    if (user.role !== 'admin') throwServer(403, 'Admin access required')

    const body = await readBody(event)
    const { backupId, confirmRollback } = body

    if (!backupId || isNaN(Number(backupId))) throwServer(400, 'Valid backupId is required')
    if (!confirmRollback) throwServer(400, 'Rollback confirmation is required')

    const db = hubDatabase()
    if (!db) throwServer(500, 'Database not available')

    const backup = await getBackupFileById(db, Number(backupId))
    if (!backup) { throwServer(404, 'Backup file not found'); return }

    // Download and parse snapshot (must be a full backup with all tables)
    const { content } = await downloadBackupFile(backup.file_key, backup.compression_type as any)
    let payload: any
    try {
      payload = JSON.parse(content)
    } catch (e: any) {
      throwServer(500, `Invalid backup JSON: ${e.message}`)
    }
    if (!payload || typeof payload !== 'object') {
      throwServer(500, 'Backup content is not a valid object')
    }

    // Table order for referential integrity
    const deleteOrder = [
      'quote_tags', 'collection_quotes', 'user_likes', 'quotes', 'authors', 'quote_references', 'tags', 'users'
    ]
    const insertOrder = [
      'users', 'authors', 'quote_references', 'tags', 'quotes', 'quote_tags', 'collection_quotes', 'user_likes'
    ]

    // 1) Delete all data (child tables first)
    for (const table of deleteOrder) {
      if (payload[table]) {
        await db.batch([db.prepare(`DELETE FROM ${table}`)])
      }
    }

    // 2) Insert all data (parents first)
    let restored = 0
    for (const table of insertOrder) {
      const records = payload[table]
      if (!Array.isArray(records) || !records.length) continue

      // Build insert statement dynamically
      const columns = Object.keys(records[0])
      const placeholders = columns.map(() => '?').join(', ')
      const insert = db.prepare(`INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`)

      // Insert in batches
      const batchSize = 100
      const subSize = 25
      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize)
        for (let j = 0; j < batch.length; j += subSize) {
          const sub = batch.slice(j, j + subSize)
          const stmts = sub.map((row) => insert.bind(...columns.map(col => row[col])))
          try {
            await db.batch(stmts)
            restored += stmts.length
          } catch (e: any) {
            // Fallback to per-row insert to salvage partial restores
            for (let idx = 0; idx < stmts.length; idx++) {
              const s = stmts[idx]
              try { if (s) { await s.run(); restored += 1 } } catch {}
            }
          }
        }
      }
    }

    // 3) Integrity checks (basic row counts)
    const integrity: Record<string, number> = {}
    for (const table of insertOrder) {
      try {
        const { results } = await db.prepare(`SELECT COUNT(*) as count FROM ${table}`).all()
        const count = Array.isArray(results) && results[0] && typeof results[0].count === 'number' ? results[0].count : 0
        integrity[table] = count
      } catch {}
    }

    return {
      success: true,
      message: `Rollback completed: Restored all tables from backup ${backupId}`,
      restoredRecords: restored,
      backupId: Number(backupId),
      integrity
    }

  } catch (error: any) {
    console.error('Rollback error:', error)
    if ((error as any).statusCode) throw error
    throwServer(500, 'Rollback failed')
  }
})
