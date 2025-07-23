/**
 * Database Backup Manager
 * Handles database backups, restoration, and cleanup for import operations
 */

export class BackupManager {
  constructor(db) {
    this.db = db
  }

  /**
   * Create a full backup of the quote_references table
   */
  async createBackup(description = 'Manual backup') {
    const backupId = `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const backupTableName = `quote_references_backup_${backupId}`
    
    try {
      // Create backup table with all current data
      await this.db.prepare(`
        CREATE TABLE ${backupTableName} AS 
        SELECT * FROM quote_references
      `).run()
      
      // Create metadata table if it doesn't exist
      await this.db.prepare(`
        CREATE TABLE IF NOT EXISTS backup_metadata (
          backup_id TEXT PRIMARY KEY,
          table_name TEXT NOT NULL,
          description TEXT,
          record_count INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          created_by INTEGER,
          restored_at DATETIME,
          is_active BOOLEAN DEFAULT TRUE
        )
      `).run()
      
      // Get record count
      const countResult = await this.db.prepare(`
        SELECT COUNT(*) as count FROM ${backupTableName}
      `).first()
      
      // Store backup metadata
      await this.db.prepare(`
        INSERT INTO backup_metadata (backup_id, table_name, description, record_count)
        VALUES (?, ?, ?, ?)
      `).bind(backupId, backupTableName, description, countResult.count).run()
      
      console.log(`Backup created: ${backupId} with ${countResult.count} records`)
      
      return {
        backupId,
        tableName: backupTableName,
        recordCount: countResult.count,
        createdAt: new Date().toISOString()
      }
      
    } catch (error) {
      console.error('Failed to create backup:', error)
      // Clean up partial backup
      try {
        await this.db.prepare(`DROP TABLE IF EXISTS ${backupTableName}`).run()
      } catch (cleanupError) {
        console.error('Failed to cleanup partial backup:', cleanupError)
      }
      throw error
    }
  }

  /**
   * Restore from a backup
   */
  async restoreFromBackup(backupId, confirmRestore = false) {
    if (!confirmRestore) {
      throw new Error('Restore confirmation required')
    }
    
    try {
      // Get backup metadata
      const backup = await this.db.prepare(`
        SELECT * FROM backup_metadata WHERE backup_id = ? AND is_active = TRUE
      `).bind(backupId).first()
      
      if (!backup) {
        throw new Error(`Backup ${backupId} not found or inactive`)
      }
      
      // Verify backup table exists
      const tableExists = await this.db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name=?
      `).bind(backup.table_name).first()
      
      if (!tableExists) {
        throw new Error(`Backup table ${backup.table_name} not found`)
      }
      
      // Begin transaction
      await this.db.prepare('BEGIN TRANSACTION').run()
      
      try {
        // Clear current data
        await this.db.prepare('DELETE FROM quote_references').run()
        
        // Restore from backup
        await this.db.prepare(`
          INSERT INTO quote_references 
          SELECT * FROM ${backup.table_name}
        `).run()
        
        // Update backup metadata
        await this.db.prepare(`
          UPDATE backup_metadata 
          SET restored_at = CURRENT_TIMESTAMP 
          WHERE backup_id = ?
        `).bind(backupId).run()
        
        // Commit transaction
        await this.db.prepare('COMMIT').run()
        
        console.log(`Restored from backup: ${backupId} (${backup.record_count} records)`)
        
        return {
          backupId,
          recordCount: backup.record_count,
          restoredAt: new Date().toISOString()
        }
        
      } catch (error) {
        await this.db.prepare('ROLLBACK').run()
        throw error
      }
      
    } catch (error) {
      console.error('Failed to restore backup:', error)
      throw error
    }
  }

  /**
   * List all available backups
   */
  async listBackups(limit = 50, offset = 0) {
    try {
      const backups = await this.db.prepare(`
        SELECT backup_id, description, record_count, created_at, restored_at, is_active
        FROM backup_metadata 
        WHERE is_active = TRUE
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `).bind(limit, offset).all()
      
      const totalCount = await this.db.prepare(`
        SELECT COUNT(*) as count FROM backup_metadata WHERE is_active = TRUE
      `).first()
      
      return {
        backups: backups.map(backup => ({
          ...backup,
          createdAt: backup.created_at,
          restoredAt: backup.restored_at,
          isRestored: !!backup.restored_at
        })),
        total: totalCount.count,
        hasMore: offset + limit < totalCount.count
      }
      
    } catch (error) {
      console.error('Failed to list backups:', error)
      throw error
    }
  }

  /**
   * Delete a backup
   */
  async deleteBackup(backupId, confirmDelete = false) {
    if (!confirmDelete) {
      throw new Error('Delete confirmation required')
    }
    
    try {
      // Get backup metadata
      const backup = await this.db.prepare(`
        SELECT * FROM backup_metadata WHERE backup_id = ? AND is_active = TRUE
      `).bind(backupId).first()
      
      if (!backup) {
        throw new Error(`Backup ${backupId} not found`)
      }
      
      // Drop backup table
      await this.db.prepare(`DROP TABLE IF EXISTS ${backup.table_name}`).run()
      
      // Mark backup as inactive
      await this.db.prepare(`
        UPDATE backup_metadata 
        SET is_active = FALSE 
        WHERE backup_id = ?
      `).bind(backupId).run()
      
      console.log(`Backup deleted: ${backupId}`)
      
      return { backupId, deletedAt: new Date().toISOString() }
      
    } catch (error) {
      console.error('Failed to delete backup:', error)
      throw error
    }
  }

  /**
   * Clean up old backups (keep only the most recent N backups)
   */
  async cleanupOldBackups(keepCount = 10) {
    try {
      // Get backups to delete (older than keepCount)
      const backupsToDelete = await this.db.prepare(`
        SELECT backup_id, table_name
        FROM backup_metadata 
        WHERE is_active = TRUE
        ORDER BY created_at DESC
        LIMIT -1 OFFSET ?
      `).bind(keepCount).all()
      
      let deletedCount = 0
      
      for (const backup of backupsToDelete) {
        try {
          await this.deleteBackup(backup.backup_id, true)
          deletedCount++
        } catch (error) {
          console.error(`Failed to delete backup ${backup.backup_id}:`, error)
        }
      }
      
      console.log(`Cleanup completed: deleted ${deletedCount} old backups`)
      
      return { deletedCount }
      
    } catch (error) {
      console.error('Failed to cleanup old backups:', error)
      throw error
    }
  }

  /**
   * Get backup statistics
   */
  async getBackupStats() {
    try {
      const stats = await this.db.prepare(`
        SELECT 
          COUNT(*) as total_backups,
          COUNT(CASE WHEN restored_at IS NOT NULL THEN 1 END) as restored_backups,
          SUM(record_count) as total_records_backed_up,
          MIN(created_at) as oldest_backup,
          MAX(created_at) as newest_backup
        FROM backup_metadata 
        WHERE is_active = TRUE
      `).first()
      
      return {
        totalBackups: stats.total_backups,
        restoredBackups: stats.restored_backups,
        totalRecordsBackedUp: stats.total_records_backed_up,
        oldestBackup: stats.oldest_backup,
        newestBackup: stats.newest_backup
      }
      
    } catch (error) {
      console.error('Failed to get backup stats:', error)
      throw error
    }
  }

  /**
   * Verify backup integrity
   */
  async verifyBackup(backupId) {
    try {
      const backup = await this.db.prepare(`
        SELECT * FROM backup_metadata WHERE backup_id = ? AND is_active = TRUE
      `).bind(backupId).first()
      
      if (!backup) {
        return { isValid: false, error: 'Backup not found' }
      }
      
      // Check if table exists
      const tableExists = await this.db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name=?
      `).bind(backup.table_name).first()
      
      if (!tableExists) {
        return { isValid: false, error: 'Backup table not found' }
      }
      
      // Check record count
      const actualCount = await this.db.prepare(`
        SELECT COUNT(*) as count FROM ${backup.table_name}
      `).first()
      
      if (actualCount.count !== backup.record_count) {
        return { 
          isValid: false, 
          error: `Record count mismatch: expected ${backup.record_count}, found ${actualCount.count}` 
        }
      }
      
      // Check table structure
      const tableInfo = await this.db.prepare(`
        PRAGMA table_info(${backup.table_name})
      `).all()
      
      const expectedColumns = [
        'id', 'name', 'original_language', 'release_date', 'description',
        'primary_type', 'secondary_type', 'image_url', 'urls',
        'views_count', 'likes_count', 'shares_count',
        'created_at', 'updated_at'
      ]
      
      const actualColumns = tableInfo.map(col => col.name)
      const missingColumns = expectedColumns.filter(col => !actualColumns.includes(col))
      
      if (missingColumns.length > 0) {
        return { 
          isValid: false, 
          error: `Missing columns: ${missingColumns.join(', ')}` 
        }
      }
      
      return { 
        isValid: true, 
        recordCount: actualCount.count,
        tableStructure: tableInfo.length
      }
      
    } catch (error) {
      return { isValid: false, error: error.message }
    }
  }
}

/**
 * Helper function to get backup manager instance
 */
export function getBackupManager() {
  const db = hubDatabase()
  if (!db) {
    throw new Error('Database not available')
  }
  return new BackupManager(db)
}
