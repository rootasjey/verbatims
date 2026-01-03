import type { 
  BackupFile, 
  BackupFileWithMetadata, 
  CreateBackupFileData,
  BackupStorageStatus
} from '~/types'
import { db, schema } from 'hub:db'
import { eq, and, desc, count, lte, gte, sql } from 'drizzle-orm'

export async function createBackupFile(data: CreateBackupFileData): Promise<number> {
  try {
    const expiresAt = data.retention_days ? new Date(Date.now() + data.retention_days * 24 * 60 * 60 * 1000) : null
    const result = await db.insert(schema.backupFiles).values({
      fileKey: data.file_key,
      exportLogId: data.export_log_id || null,
      importLogId: data.import_log_id || null,
      filename: data.filename,
      filePath: data.file_path,
      fileSize: data.file_size,
      compressedSize: data.compressed_size || null,
      contentHash: data.content_hash || null,
      compressionType: data.compression_type || 'none',
      retentionDays: data.retention_days || 90,
      expiresAt: expiresAt,
      metadata: data.metadata || null,
      storageStatus: 'uploading'
    }).returning({ id: schema.backupFiles.id }).get()

    return result.id
  } catch (error: any) {
    console.error('Failed to create backup file record:', error)
    throw new Error(`Database error: ${error.message}`)
  }
}

export async function updateBackupFileStatus(backupId: number, status: BackupStorageStatus, uploadedAt?: Date): Promise<void> {
  try {
    await db.update(schema.backupFiles)
      .set({
        storageStatus: status,
        uploadedAt: uploadedAt || null
      })
      .where(eq(schema.backupFiles.id, backupId))
  } catch (error: any) {
    console.error('Failed to update backup file status:', error)
    throw new Error(`Database error: ${error.message}`)
  }
}

export async function getBackupFileById(backupId: number): Promise<BackupFile | null> {
  try {
    const result = await db.select().from(schema.backupFiles).where(eq(schema.backupFiles.id, backupId)).get()
    return result || null
  } catch (error) {
    console.error('Failed to get backup file by ID:', error)
    return null
  }
}

export async function getBackupFileByKey(fileKey: string): Promise<BackupFile | null> {
  try {
    const result = await db.select().from(schema.backupFiles).where(eq(schema.backupFiles.fileKey, fileKey)).get()
    return result || null
  } catch (error) {
    console.error('Failed to get backup file by key:', error)
    return null
  }
}

export async function getBackupFilesForExport(exportLogId: number): Promise<BackupFile[]> {
  try {
    const result = await db.select()
      .from(schema.backupFiles)
      .where(eq(schema.backupFiles.exportLogId, exportLogId))
      .orderBy(desc(schema.backupFiles.createdAt))
      .all()
    return result || []
  } catch (error) {
    console.error('Failed to get backup files for export:', error)
    return []
  }
}

export async function listBackupFiles(
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

    const whereConditions = []
    
    if (status) { whereConditions.push(eq(schema.backupFiles.storageStatus, status)) }
    if (dateFrom) { whereConditions.push(gte(schema.backupFiles.createdAt, new Date(dateFrom))) }
    if (dateTo) { whereConditions.push(lte(schema.backupFiles.createdAt, new Date(dateTo))) }
    
    const [countResult] = await db.select({ total: count() })
      .from(schema.backupFiles)
      .where(and(...whereConditions))

    const total = Number(countResult?.total ?? 0) || 0

    const filesResult = await db.select({
        ...schema.backupFiles,
        dataType: schema.exportLogs.dataType,
        userId: schema.exportLogs.userId,
        userName: schema.users.name
      })
      .from(schema.backupFiles)
      .leftJoin(schema.exportLogs, eq(schema.backupFiles.exportLogId, schema.exportLogs.id))
      .leftJoin(schema.users, eq(schema.exportLogs.userId, schema.users.id))
      .where(and(...whereConditions))
      .orderBy(desc(schema.backupFiles.createdAt))
      .limit(limit)
      .offset(offset)
      .all()

    const files = filesResult.map((file: any) => ({ ...file, metadata: file.metadata ? JSON.parse(file.metadata) : null }))

    return { files, total, page, limit, totalPages: Math.ceil(total / limit) }
  } catch (error: any) {
    console.error('Failed to list backup files:', error)
    throw new Error(`Database error: ${error.message}`)
  }
}

export async function trackBackupFileAccess(backupId: number): Promise<void> {
  try {
    await db.update(schema.backupFiles)
      .set({
        accessCount: sql`${schema.backupFiles.accessCount} + 1`,
        lastAccessedAt: new Date()
      })
      .where(eq(schema.backupFiles.id, backupId))
  } catch (error) {
    console.error('Failed to track backup file access:', error)
  }
}

export async function deleteExpiredBackupFiles(): Promise<number> {
  try {
    const result = await db.delete(schema.backupFiles)
      .where(and(
        sql`${schema.backupFiles.expiresAt} IS NOT NULL`,
        lte(schema.backupFiles.expiresAt, new Date())
      ))
      .returning({ id: schema.backupFiles.id })
      .all()
    return result.length
  } catch (error) {
    console.error('Failed to delete expired backup files:', error)
    return 0
  }
}

export async function deleteBackupFileRecord(backupId: number): Promise<boolean> {
  try {
    const result = await db.delete(schema.backupFiles)
      .where(eq(schema.backupFiles.id, backupId))
      .returning({ id: schema.backupFiles.id })
      .get()
    return !!result
  } catch (error) {
    console.error('Failed to delete backup file record:', error)
    return false
  }
}

