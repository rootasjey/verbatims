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
    if (user.role !== 'admin') { throw createError({ statusCode: 403, statusMessage: 'Admin access required' }) }

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
    if (!backup) { throw createError({ statusCode: 404, statusMessage: 'Backup file not found' }) }

    // Determine data type from metadata (created by import utilities)
    let dataType = 'references'
    try {
      const meta = backup.metadata ? JSON.parse(String(backup.metadata)) : {}
      if (meta?.data_type) dataType = String(meta.data_type)
    } catch {}

    if (dataType !== 'references') {
      throw createError({
        statusCode: 400,
        statusMessage: `Rollback currently supports 'references' snapshots only (got '${dataType}')`
      })
    }

    // Download and parse snapshot
    const { content } = await downloadBackupFile(backup.file_key, backup.compression_type as any)
    let payload: any
    try {
      payload = JSON.parse(content)
    } catch (e: any) {
      throw createError({ statusCode: 500, statusMessage: `Invalid backup JSON: ${e.message}` })
    }
    const records: any[] = Array.isArray(payload?.data) ? payload.data : (Array.isArray(payload) ? payload : [])
    if (!Array.isArray(records)) {
      throw createError({ statusCode: 500, statusMessage: 'Backup content has no data array to restore' })
    }

    // Prepare insert statement for quote_references
    const insert = db.prepare(`
      INSERT INTO quote_references (
        name, original_language, release_date, description, primary_type, secondary_type,
        image_url, urls, views_count, likes_count, shares_count, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    // 1) Clear target table (standalone batch)
    await db.batch([ db.prepare('DELETE FROM quote_references') ])

    // 2) Insert in sub-batches
    const batchSize = 100
    const subSize = 25
    let restored = 0

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize)
      for (let j = 0; j < batch.length; j += subSize) {
        const sub = batch.slice(j, j + subSize)
        const stmts = sub.map((reference) => {
          let urlsField = '[]'
          if (reference?.urls != null) {
            if (Array.isArray(reference.urls)) urlsField = JSON.stringify(reference.urls)
            else if (typeof reference.urls === 'string') urlsField = reference.urls
            else if (typeof reference.urls === 'object') urlsField = JSON.stringify(reference.urls)
          }
          return insert.bind(
            reference.name,
            reference.original_language || 'en',
            reference.release_date || null,
            reference.description || '',
            reference.primary_type,
            reference.secondary_type || '',
            reference.image_url || '',
            urlsField,
            reference.views_count || 0,
            reference.likes_count || 0,
            reference.shares_count || 0,
            reference.created_at || new Date().toISOString(),
            reference.updated_at || new Date().toISOString(),
          )
        })

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

    return {
      success: true,
      message: `Rollback completed: Restored ${restored} references from backup ${backupId}`,
      restoredRecords: restored,
      backupId: Number(backupId)
    }

  } catch (error: any) {
    console.error('Rollback error:', error)
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Rollback failed' })
  }
})
