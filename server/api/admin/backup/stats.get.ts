/**
 * Admin API: Backup Statistics
 * Provides comprehensive statistics about backup files and storage usage
 */
export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireUserSession(event)
    if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
      throw createError({ statusCode: 403, statusMessage: 'Admin or moderator access required' })
    }

    const db = hubDatabase()

    // Ensure backup_files table exists
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS backup_files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_key TEXT NOT NULL UNIQUE,
        export_log_id INTEGER,
        filename TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_size INTEGER,
        compressed_size INTEGER,
        content_hash TEXT,
        compression_type TEXT DEFAULT 'none',
        storage_status TEXT DEFAULT 'uploading' CHECK (storage_status IN ('uploading', 'stored', 'failed', 'expired')),
        retention_days INTEGER DEFAULT 90,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        uploaded_at DATETIME,
        expires_at DATETIME,
        last_accessed_at DATETIME,
        access_count INTEGER DEFAULT 0,
        metadata TEXT,
        FOREIGN KEY (export_log_id) REFERENCES export_logs(id) ON DELETE CASCADE
      )
    `).run()

    // Get overall statistics
    const overallStats = await db.prepare(`
      SELECT 
        COUNT(*) as total_backups,
        COUNT(CASE WHEN storage_status = 'stored' THEN 1 END) as stored_backups,
        COUNT(CASE WHEN storage_status = 'uploading' THEN 1 END) as uploading_backups,
        COUNT(CASE WHEN storage_status = 'failed' THEN 1 END) as failed_backups,
        COUNT(CASE WHEN expires_at IS NOT NULL AND expires_at <= datetime('now') THEN 1 END) as expired_backups,
        SUM(CASE WHEN file_size IS NOT NULL THEN file_size ELSE 0 END) as total_size_bytes,
        SUM(CASE WHEN compressed_size IS NOT NULL THEN compressed_size ELSE file_size END) as total_compressed_size_bytes,
        AVG(file_size) as avg_file_size_bytes,
        SUM(access_count) as total_downloads
      FROM backup_files
    `).first()

    // Get statistics by data type (from metadata)
    const dataTypeStats = await db.prepare(`
      SELECT 
        el.data_type,
        COUNT(bf.id) as backup_count,
        SUM(CASE WHEN bf.file_size IS NOT NULL THEN bf.file_size ELSE 0 END) as total_size_bytes,
        AVG(bf.file_size) as avg_file_size_bytes
      FROM backup_files bf
      LEFT JOIN export_logs el ON bf.export_log_id = el.id
      WHERE bf.storage_status = 'stored'
      GROUP BY el.data_type
      ORDER BY backup_count DESC
    `).all()

    // Get statistics by format
    const formatStats = await db.prepare(`
      SELECT 
        el.format,
        COUNT(bf.id) as backup_count,
        SUM(CASE WHEN bf.file_size IS NOT NULL THEN bf.file_size ELSE 0 END) as total_size_bytes
      FROM backup_files bf
      LEFT JOIN export_logs el ON bf.export_log_id = el.id
      WHERE bf.storage_status = 'stored'
      GROUP BY el.format
      ORDER BY backup_count DESC
    `).all()

    // Get recent backup activity (last 30 days)
    const recentActivity = await db.prepare(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as backups_created,
        SUM(CASE WHEN file_size IS NOT NULL THEN file_size ELSE 0 END) as total_size_bytes
      FROM backup_files
      WHERE created_at >= datetime('now', '-30 days')
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 30
    `).all()

    // Get compression statistics
    const compressionStats = await db.prepare(`
      SELECT 
        compression_type,
        COUNT(*) as file_count,
        SUM(file_size) as original_size_bytes,
        SUM(CASE WHEN compressed_size IS NOT NULL THEN compressed_size ELSE file_size END) as compressed_size_bytes,
        AVG(CASE 
          WHEN compressed_size IS NOT NULL AND file_size > 0 
          THEN (1.0 - CAST(compressed_size AS REAL) / CAST(file_size AS REAL)) * 100 
          ELSE 0 
        END) as avg_compression_ratio_percent
      FROM backup_files
      WHERE storage_status = 'stored'
      GROUP BY compression_type
    `).all()

    return {
      success: true,
      data: {
        overview: {
          total_backups: Number(overallStats?.total_backups ?? 0) || 0,
          stored_backups: Number(overallStats?.stored_backups ?? 0) || 0,
          uploading_backups: Number(overallStats?.uploading_backups ?? 0) || 0,
          failed_backups: Number(overallStats?.failed_backups ?? 0) || 0,
          expired_backups: Number(overallStats?.expired_backups ?? 0) || 0,
          total_size_bytes: Number(overallStats?.total_size_bytes ?? 0) || 0,
          total_compressed_size_bytes: Number(overallStats?.total_compressed_size_bytes ?? 0) || 0,
          avg_file_size_bytes: Number(overallStats?.avg_file_size_bytes ?? 0) || 0,
          total_downloads: Number(overallStats?.total_downloads ?? 0) || 0,
          storage_efficiency_percent: Number(overallStats?.total_size_bytes ?? 0) > 0
            ? ((1 - (Number(overallStats?.total_compressed_size_bytes ?? 0) / Number(overallStats?.total_size_bytes ?? 0)) * 100))
            : 0
        },
        by_data_type: dataTypeStats?.results || [],
        by_format: formatStats?.results || [],
        recent_activity: recentActivity?.results || [],
        compression: compressionStats?.results || [],
        generated_at: new Date().toISOString()
      }
    }

  } catch (error: any) {
    console.error('Backup stats error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to get backup statistics'
    })
  }
})
