/**
 * Admin API: List Backups for an Import
 * Returns backup_files linked to a given import_id (string), with download URLs
 */
export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireUserSession(event)
    if (user.role !== 'admin') { throw createError({ statusCode: 403, statusMessage: 'Admin access required' }) }

    const importId = getRouterParam(event, 'id')
    if (!importId) { throw createError({ statusCode: 400, statusMessage: 'Import ID is required' }) }

    const db = hubDatabase()
    if (!db) throw createError({ statusCode: 500, statusMessage: 'Database not available' })

    const importLog = await db.prepare(`SELECT id FROM import_logs WHERE import_id = ? LIMIT 1`).bind(importId).first()
    if (!importLog?.id) {
      return { success: true, data: { files: [], total: 0 } }
    }

    const { results = [] } = await db.prepare(`
      SELECT id, file_key, filename, file_path, file_size, compressed_size, compression_type, storage_status, created_at, uploaded_at, expires_at, metadata
      FROM backup_files
      WHERE import_log_id = ?
      ORDER BY created_at DESC
    `).bind(importLog.id).all<any>()

    const files = results.map((r: any) => ({
      id: r.id,
      filename: r.filename,
      file_path: r.file_path,
      file_size: r.file_size,
      compressed_size: r.compressed_size,
      compression_type: r.compression_type,
      storage_status: r.storage_status,
      created_at: r.created_at,
      uploaded_at: r.uploaded_at,
      expires_at: r.expires_at,
      metadata: r.metadata ? JSON.parse(r.metadata) : null,
      downloadUrl: `/api/admin/backup/download/${r.id}`,
    }))

    return {
      success: true,
      data: { files, total: files.length }
    }
  } catch (error: any) {
    console.error('Import backup listing failed:', error)
    throw createError({ statusCode: error.statusCode || 500, statusMessage: error.statusMessage || 'Failed to list import backups' })
  }
})

