/**
 * Backup Storage Utilities (Functional)
 * Handles file storage and retrieval using Cloudflare R2 via NuxtHub blob storage
 */

import { createHash } from 'node:crypto'
import { gzipSync, gunzipSync, strToU8, strFromU8 } from 'fflate'
import type { BackupFile, BackupCompressionType } from '~/types'

/**
 * Generate R2 file path using archives prefix
 */
export function generateBackupFilePath(filename: string): string {
  const date = new Date().toISOString().split('T')[0] // YYYY-MM-DD
  return `backups/${date}/${filename}`
}

/**
 * Calculate SHA-256 hash of content for integrity verification
 */
export function calculateContentHash(content: string | Buffer): string {
  return createHash('sha256').update(content).digest('hex')
}

/**
 * Compress content using gzip if beneficial
 */
export async function compressContent(content: string): Promise<{
  compressed: Uint8Array
  originalSize: number
  compressedSize: number
  compressionType: BackupCompressionType
}> {
  const originalU8 = strToU8(content)
  const originalSize = originalU8.byteLength

  // Only compress if content is larger than 1KB
  if (originalSize < 1024) {
    return {
      compressed: originalU8,
      originalSize,
      compressedSize: originalSize,
      compressionType: 'none'
    }
  }

  try {
    const gz = gzipSync(originalU8, { level: 6 })
    const compressedSize = gz.byteLength

    // Only use compression if it reduces size by at least 10%
    if (compressedSize < originalSize * 0.9) {
      return {
        compressed: gz,
        originalSize,
        compressedSize,
        compressionType: 'gzip'
      }
    }

    return {
      compressed: originalU8,
      originalSize,
      compressedSize: originalSize,
      compressionType: 'none'
    }
  } catch (error) {
    console.warn('Compression failed, using uncompressed content:', error)
    return {
      compressed: originalU8,
      originalSize,
      compressedSize: originalSize,
      compressionType: 'none'
    }
  }
}

/**
 * Decompress content if it was compressed
 */
export async function decompressContent(
  content: Uint8Array,
  compressionType: BackupCompressionType
): Promise<string> {
  if (compressionType === 'none') {
    return strFromU8(content)
  }

  if (compressionType === 'gzip') {
    try {
      const decompressed = gunzipSync(content)
      return strFromU8(decompressed)
    } catch (error: any) {
      throw new Error(`Failed to decompress gzipped content: ${error.message}`)
    }
  }

  throw new Error(`Unsupported compression type: ${compressionType}`)
}

/**
 * Upload backup file to R2 storage
 */
export async function uploadBackupFile(
  content: string,
  filename: string,
  dataType: string,
  format: string
): Promise<{
  fileKey: string
  filePath: string
  fileSize: number
  compressedSize: number
  contentHash: string
  compressionType: BackupCompressionType
}> {
  try {
    // Use full path as the storage key to keep DB and R2 consistent
    const fileKey = generateBackupFilePath(filename)
    const filePath = fileKey

    const { compressed, originalSize, compressedSize, compressionType } = await compressContent(content)
    const contentHash = calculateContentHash(Buffer.from(compressed))

    const blob = hubBlob()
    if (!fileKey || fileKey.length === 0) {
      throw new Error('Invalid file key: empty or null')
    }

    if (!compressed || compressed.length === 0) {
      throw new Error('Invalid content: empty or null')
    }

    try {
      let uploadData: any

      // Always use the compressed data (whether actually compressed or not) for consistency
      // This ensures upload/download symmetry
      const ab = compressed.byteOffset === 0 && compressed.byteLength === compressed.buffer.byteLength
        ? (compressed.buffer as ArrayBuffer)
        : compressed.slice().buffer as ArrayBuffer
      uploadData = new Blob([ab], {
        type: compressionType === 'gzip' ? 'application/octet-stream' : 'application/json'
      })

      await blob.put(fileKey, uploadData, {
        addRandomSuffix: false,
      })
    } catch (uploadError: any) {
      throw uploadError
    }

    return {
      fileKey,
      filePath,
      fileSize: originalSize,
      compressedSize,
      contentHash,
      compressionType
    }

  } catch (error: any) {
    console.error('Failed to upload backup file to R2:', error)
    throw new Error(`Backup upload failed: ${error.message}`)
  }
}

/**
 * Download backup file from R2 storage
 */
export async function downloadBackupFile(
  fileKey: string,
  compressionType: BackupCompressionType = 'none'
): Promise<{
  content: string
  metadata: Record<string, string>
}> {
  try {
    const blob = hubBlob()
    const file = await blob.get(fileKey)
    if (!file) { throw new Error('Backup file not found in R2 storage') }

    const arrayBuffer = await file.arrayBuffer()
    const u8 = new Uint8Array(arrayBuffer)
    const content = await decompressContent(u8, compressionType)

    return {
      content,
      metadata: {} // Metadata is now stored in database, not R2
    }

  } catch (error: any) {
    console.error('Failed to download backup file from R2:', error)
    throw new Error(`Backup download failed: ${error.message}`)
  }
}

/**
 * Delete backup file from R2 storage
 */
export async function deleteBackupFile(fileKey: string): Promise<void> {
  try {
    const blob = hubBlob()
    await blob.delete(fileKey)
  } catch (error: any) {
    console.error('Failed to delete backup file from R2:', error)
    throw new Error(`Backup deletion failed: ${error.message}`)
  }
}

/**
 * Check if backup file exists in R2 storage
 */
export async function backupFileExists(fileKey: string): Promise<boolean> {
  try {
    const blob = hubBlob()
    const file = await blob.head(fileKey)
    return !!file
  } catch (error) {
    return false
  }
}

/**
 * Get backup file metadata from R2 storage (placeholder; metadata now in DB)
 */
export async function getBackupFileMetadata(fileKey: string): Promise<Record<string, string> | null> {
  try {
    const blob = hubBlob()
    const file = await blob.head(fileKey)
    return file ? {} : null // Metadata is now stored in database, not R2
  } catch (error) {
    console.error('Failed to get backup file metadata:', error)
    return null
  }
}

/**
 * Create a complete backup (upload to R2 + database record)
 */
export async function createBackup(
  db: any,
  content: string,
  filename: string,
  dataType: string,
  format: string,
  options: {
    exportLogId?: number
    retentionDays?: number
    metadata?: Record<string, any>
  } = {}
): Promise<{
  backupId: number
  fileKey: string
  filePath: string
  fileSize: number
  compressedSize: number
  contentHash: string
  compressionType: BackupCompressionType
}> {
  const { exportLogId, retentionDays = 90, metadata } = options

  try {
    const uploadResult = await uploadBackupFile(content, filename, dataType, format)
    const backupId = await createBackupFile(db, {
      file_key: uploadResult.fileKey,
      export_log_id: exportLogId,
      filename,
      file_path: uploadResult.filePath,
      file_size: uploadResult.fileSize,
      compressed_size: uploadResult.compressedSize,
      content_hash: uploadResult.contentHash,
      compression_type: uploadResult.compressionType,
      retention_days: retentionDays,
      metadata: metadata ? JSON.stringify(metadata) : undefined
    })

    await updateBackupFileStatus(db, backupId, 'stored', new Date())

    return {
      backupId,
      ...uploadResult
    }
  } catch (error: any) {
    console.error('Failed to create backup:', error)
    throw new Error(`Backup creation failed: ${error.message}`)
  }
}

/**
 * Retrieve backup content by backup ID
 */
export async function getBackup(
  db: any,
  backupId: number
): Promise<{
  content: string
  metadata: Record<string, any>
  backupFile: BackupFile
}> {
  try {
    const backupFile = await getBackupFileById(db, backupId)
    if (!backupFile) { throw new Error('Backup file not found') }

    if (backupFile.storage_status !== 'stored') {
      throw new Error(`Backup file is not available (status: ${backupFile.storage_status})`)
    }

    const { content, metadata: r2Metadata } = await downloadBackupFile(
      backupFile.file_key,
      backupFile.compression_type as BackupCompressionType
    )

    await trackBackupFileAccess(db, backupId)
    const dbMetadata = backupFile.metadata ? JSON.parse(backupFile.metadata) : {}

    return {
      content,
      metadata: { ...dbMetadata, ...r2Metadata },
      backupFile
    }
  } catch (error: any) {
    console.error('Failed to get backup:', error)
    throw new Error(`Backup retrieval failed: ${error.message}`)
  }
}

/**
 * Delete backup (both R2 and database)
 */
export async function deleteBackup(db: any, backupId: number): Promise<void> {
  try {
    const backupFile = await getBackupFileById(db, backupId)
    if (!backupFile) { throw new Error('Backup file not found') }

    await deleteBackupFile(backupFile.file_key)
    await deleteBackupFileRecord(db, backupId)
  } catch (error: any) {
    console.error('Failed to delete backup:', error)
    throw new Error(`Backup deletion failed: ${error.message}`)
  }
}

