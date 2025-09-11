import type { 
  BackupFile, 
  BackupFileWithMetadata, 
  CreateBackupFileData,
  BackupStorageStatus
} from '~/types'

export async function createBackupFile(db: any, data: CreateBackupFileData): Promise<number> {
  try {
    await ensureBackupFilesTable(db)
    const expiresAt = data.retention_days ? new Date(Date.now() + data.retention_days * 24 * 60 * 60 * 1000).toISOString() : null
    const result = await db.prepare(`
      INSERT INTO backup_files (
        file_key, export_log_id, import_log_id, filename, file_path, file_size,
        compressed_size, content_hash, compression_type, retention_days,
        expires_at, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      data.file_key,
      data.export_log_id || null,
      data.import_log_id || null,
      data.filename,
      data.file_path,
      data.file_size,
      data.compressed_size || null,
      data.content_hash || null,
      data.compression_type || 'none',
      data.retention_days || 90,
      expiresAt,
      data.metadata || null
    ).run()

    return result.meta.last_row_id
  } catch (error: any) {
    console.error('Failed to create backup file record:', error)
    throw new Error(`Database error: ${error.message}`)
  }
}

export async function updateBackupFileStatus(db: any, backupId: number, status: BackupStorageStatus, uploadedAt?: Date): Promise<void> {
  try {
    const uploadedAtStr = uploadedAt ? uploadedAt.toISOString() : null
    await db.prepare(`
      UPDATE backup_files 
      SET storage_status = ?, uploaded_at = ? 
      WHERE id = ?
    `).bind(status, uploadedAtStr, backupId).run()
  } catch (error: any) {
    console.error('Failed to update backup file status:', error)
    throw new Error(`Database error: ${error.message}`)
  }
}

export async function getBackupFileById(db: any, backupId: number): Promise<BackupFile | null> {
  try {
    const result = await db.prepare(`
      SELECT * FROM backup_files 
      WHERE id = ?
    `).bind(backupId).first()

    return result || null
  } catch (error) {
    console.error('Failed to get backup file by ID:', error)
    return null
  }
}

export async function getBackupFileByKey(db: any, fileKey: string): Promise<BackupFile | null> {
  try {
    const result = await db.prepare(`
      SELECT * FROM backup_files 
      WHERE file_key = ?
    `).bind(fileKey).first()
    return result || null
  } catch (error) {
    console.error('Failed to get backup file by key:', error)
    return null
  }
}

export async function getBackupFilesForExport(db: any, exportLogId: number): Promise<BackupFile[]> {
  try {
    const result = await db.prepare(`
      SELECT * FROM backup_files 
      WHERE export_log_id = ? 
      ORDER BY created_at DESC
    `).bind(exportLogId).all()
    return result?.results || []
  } catch (error) {
    console.error('Failed to get backup files for export:', error)
    return []
  }
}

export async function listBackupFiles(
  db: any,
  options: { 
    page?: number; 
    limit?: number; 
    status?: BackupStorageStatus; 
    dataType?: string; 
    dateFrom?: string; 
    dateTo?: string 
  } = {}
): Promise<{ 
  files: BackupFileWithMetadata[]; 
  total: number; 
  page: number; 
  limit: number; 
  totalPages: number }> {
  try {
    const { page = 1, limit = 20, status, dataType, dateFrom, dateTo } = options
    const offset = (page - 1) * limit

    const conditions: string[] = []
    const bindings: any[] = []
    
    if (status) { conditions.push('bf.storage_status = ?'); bindings.push(status) }
    if (dateFrom) { conditions.push('bf.created_at >= ?'); bindings.push(dateFrom) }
    if (dateTo) { conditions.push('bf.created_at <= ?'); bindings.push(dateTo) }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    const countResult = await db.prepare(`
      SELECT COUNT(*) as total 
      FROM backup_files bf 
      ${whereClause}
    `).bind(...bindings).first()

    const total = Number(countResult?.total ?? 0) || 0

    const filesResult = await db.prepare(`
      SELECT 
        bf.*, 
        el.data_type, 
        el.user_id, 
        u.name as user_name 
      FROM backup_files bf 
      LEFT JOIN export_logs el ON bf.export_log_id = el.id 
      LEFT JOIN users u ON el.user_id = u.id 
      ${whereClause} 
      ORDER BY bf.created_at DESC 
      LIMIT ? OFFSET ?`
    ).bind(...bindings, limit, offset).all()

    const files = (filesResult?.results || []).map((file: any) => ({ ...file, metadata: file.metadata ? JSON.parse(file.metadata) : null }))

    return { files, total, page, limit, totalPages: Math.ceil(total / limit) }
  } catch (error: any) {
    console.error('Failed to list backup files:', error)
    throw new Error(`Database error: ${error.message}`)
  }
}

export async function trackBackupFileAccess(db: any, backupId: number): Promise<void> {
  try {
    await db.prepare(`
      UPDATE backup_files 
      SET access_count = access_count + 1, last_accessed_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).bind(backupId).run()
  } catch (error) {
    console.error('Failed to track backup file access:', error)
  }
}

export async function deleteExpiredBackupFiles(db: any): Promise<number> {
  try {
    const result = await db.prepare(`
      DELETE FROM backup_files 
      WHERE expires_at IS NOT NULL AND expires_at <= CURRENT_TIMESTAMP
    `).run()
    return result.meta.changes || 0
  } catch (error) {
    console.error('Failed to delete expired backup files:', error)
    return 0
  }
}

export async function deleteBackupFileRecord(db: any, backupId: number): Promise<boolean> {
  try {
    const result = await db.prepare(`
      DELETE FROM backup_files 
      WHERE id = ?
    `).bind(backupId).run()
    return (result.meta.changes || 0) > 0
  } catch (error) {
    console.error('Failed to delete backup file record:', error)
    return false
  }
}

async function ensureBackupFilesTable(db: any): Promise<void> {
  try {
    await db.prepare(
      `CREATE TABLE IF NOT EXISTS backup_files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_key TEXT NOT NULL UNIQUE,
        export_log_id INTEGER,
        import_log_id INTEGER,
        filename TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_size INTEGER,
        compressed_size INTEGER,
        content_hash TEXT,
        compression_type TEXT DEFAULT 'none',
        storage_status TEXT DEFAULT 'uploading' CHECK (storage_status IN ('uploading','stored','failed','expired')),
        retention_days INTEGER DEFAULT 90,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        uploaded_at DATETIME,
        expires_at DATETIME,
        last_accessed_at DATETIME,
        access_count INTEGER DEFAULT 0,
        metadata TEXT,
        FOREIGN KEY (export_log_id) REFERENCES export_logs(id) ON DELETE CASCADE,
        FOREIGN KEY (import_log_id) REFERENCES import_logs(id) ON DELETE SET NULL
      )`
    ).run()
  } catch (error) {
    // Table might already exist, ignore error
  }
}

