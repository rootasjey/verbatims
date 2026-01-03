import { getBackup } from '~/server/utils/backup-storage'
import { getBackupFileById, trackBackupFileAccess } from '~/server/utils/backup-database'
import { blob } from 'hub:blob'

/**
 * Admin API: Download Backup File
 * Serves backup files from Cloudflare R2 storage via NuxtHub blob
 */
export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireUserSession(event)
    if (user.role !== 'admin' && user.role !== 'moderator') {
      throw createError({
        statusCode: 403,
        statusMessage: 'Admin or moderator access required',
      })
    }

    const backupId = getRouterParam(event, 'id')
    if (!backupId || isNaN(Number(backupId))) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid backup ID' })
    }

    // First, look up the backup file to determine how to serve it
    const backupNumericId = Number(backupId)
    const backupFileRecord = await getBackupFileById(backupNumericId)
    if (!backupFileRecord) {
      throw createError({ statusCode: 404, statusMessage: 'Backup file not found' })
    }

    const ext = backupFileRecord.filename.split('.').pop()?.toLowerCase()

    // If it's a ZIP, serve the binary directly from R2 without UTF-8 conversion
    if (ext === 'zip') {
      const file = await blob.get(backupFileRecord.file_key)
      if (!file) {
        throw createError({ statusCode: 404, statusMessage: 'Backup file not found in storage' })
      }

      const arrayBuffer = await file.arrayBuffer()

      setHeader(event, 'Content-Type', 'application/zip')
      setHeader(event, 'Content-Disposition', `attachment; filename="${backupFileRecord.filename}"`)
      setHeader(event, 'Content-Length', arrayBuffer.byteLength)
      setHeader(event, 'Cache-Control', 'private, max-age=3600')

      setHeader(event, 'X-Backup-ID', backupFileRecord.id.toString())
      setHeader(event, 'X-Backup-Created', backupFileRecord.created_at)
      setHeader(event, 'X-Backup-File-Path', backupFileRecord.file_path)
      if (backupFileRecord.content_hash) {
        setHeader(event, 'X-Content-Hash', backupFileRecord.content_hash)
      }

      await trackBackupFileAccess(backupNumericId)
      return new Uint8Array(arrayBuffer)
    }

    // For non-binary formats (json/csv/xml), use the existing text-based retrieval
    const { content, backupFile } = await getBackup(Number(backupId))

    let mimeType = 'application/octet-stream'
    switch (ext) {
      case 'json':
        mimeType = 'application/json'
        break
      case 'csv':
        mimeType = 'text/csv'
        break
      case 'xml':
        mimeType = 'application/xml'
        break
    }

    setHeader(event, 'Content-Type', mimeType)
    setHeader(event, 'Content-Disposition', `attachment; filename="${backupFile.filename}"`)
    setHeader(event, 'Content-Length', Buffer.byteLength(content, 'utf-8'))
    setHeader(event, 'Cache-Control', 'private, max-age=3600') // Cache for 1 hour

    setHeader(event, 'X-Backup-ID', backupFile.id.toString())
    setHeader(event, 'X-Backup-Created', backupFile.created_at)
    setHeader(event, 'X-Backup-File-Path', backupFile.file_path)

    if (backupFile.content_hash) {
      setHeader(event, 'X-Content-Hash', backupFile.content_hash)
    }

    return content

  } catch (error: any) {
    console.error('Backup download endpoint error:', error)
    if (error.message?.includes('not found')) {
      throw createError({ statusCode: 404, statusMessage: 'Backup file not found' })
    }

    if (error.message?.includes('not available')) {
      throw createError({ statusCode: 410, statusMessage: 'Backup file is not available' })
    }

    if ((error as any).statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Internal server error' })
  }
})
