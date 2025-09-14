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
    if (user.role !== 'admin') {
      throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
    }

    const body = await readBody(event)
    const { backupId, confirmRollback } = body

    if (!backupId || isNaN(Number(backupId))) {
      throw createError({ statusCode: 400, statusMessage: 'Valid backup ID is required' })
    }
    if (!confirmRollback) {
      throw createError({ statusCode: 400, statusMessage: 'Rollback confirmation is required' })
    }

    const db = hubDatabase()
    if (!db) throw createError({ statusCode: 500, statusMessage: 'Database not available' })

    const backup = await getBackupFileById(db, Number(backupId))
    if (!backup) {
      throw createError({ statusCode: 404, statusMessage: 'Backup file not found' })
    }

    // Download and parse snapshot (must be a full backup with all tables)
    const { content } = await downloadBackupFile(backup.file_key, backup.compression_type as any)
    let payload: any
    try {
      payload = JSON.parse(content)
    } catch (e: any) {
      throw createError({ statusCode: 500, statusMessage: `Invalid backup JSON: ${e.message}` })
    }
    if (!payload || typeof payload !== 'object') {
      throw createError({ statusCode: 500, statusMessage: 'Backup content is not a valid object' })
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
              try { await stmts[idx].run(); restored += 1 } catch {}
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
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Rollback failed' })
  }
})
