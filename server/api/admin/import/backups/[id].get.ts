import { db, schema } from 'hub:db'
import { eq, desc } from 'drizzle-orm'

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

    const importLog = await db.select({ id: schema.importLogs.id })
      .from(schema.importLogs)
      .where(eq(schema.importLogs.importId, importId))
      .limit(1)
      .get()
    
    if (!importLog?.id) {
      return { success: true, data: { files: [], total: 0 } }
    }

    const results = await db.select({
      id: schema.backupFiles.id,
      fileKey: schema.backupFiles.fileKey,
      filename: schema.backupFiles.filename,
      filePath: schema.backupFiles.filePath,
      fileSize: schema.backupFiles.fileSize,
      compressedSize: schema.backupFiles.compressedSize,
      compressionType: schema.backupFiles.compressionType,
      storageStatus: schema.backupFiles.storageStatus,
      createdAt: schema.backupFiles.createdAt,
      uploadedAt: schema.backupFiles.uploadedAt,
      expiresAt: schema.backupFiles.expiresAt,
      metadata: schema.backupFiles.metadata,
    })
      .from(schema.backupFiles)
      .where(eq(schema.backupFiles.importLogId, importLog.id))
      .orderBy(desc(schema.backupFiles.createdAt))

    const files = results.map((r: any) => ({
      id: r.id,
      filename: r.filename,
      file_path: r.filePath,
      file_size: r.fileSize,
      compressed_size: r.compressedSize,
      compression_type: r.compressionType,
      storage_status: r.storageStatus,
      created_at: r.createdAt,
      uploaded_at: r.uploadedAt,
      expires_at: r.expiresAt,
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

