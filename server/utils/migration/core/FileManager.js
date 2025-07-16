/**
 * File Manager for Migration System
 * Handles file organization, naming conventions, and directory structure
 * for migration-related files with proper type-specific organization.
 */

import { existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'

export class FileManager {
  constructor(migrationType) {
    this.migrationType = migrationType
    this.baseBackupDir = join(process.cwd(), 'server/database/backups')
    this.migrationDir = join(this.baseBackupDir, migrationType)
    
    // Ensure migration-specific directory exists
    this.ensureDirectoryExists(this.migrationDir)
  }

  /**
   * Get path for validation report with timestamp
   */
  getValidationReportPath(timestamp) {
    const filename = `${this.migrationType}-validation-report-${timestamp}.md`
    return join(this.migrationDir, filename)
  }

  /**
   * Get path for migration summary report with timestamp
   */
  getMigrationReportPath(timestamp) {
    const filename = `${this.migrationType}-migration-report-${timestamp}.md`
    return join(this.migrationDir, filename)
  }

  /**
   * Get path for transformed data with timestamp
   */
  getTransformedDataPath(timestamp) {
    const filename = `transformed-${this.migrationType}-${timestamp}.json`
    return join(this.migrationDir, filename)
  }

  /**
   * Get path for test results with timestamp
   */
  getTestResultsPath(timestamp) {
    const filename = `${this.migrationType}-test-results-${timestamp}.json`
    return join(this.migrationDir, filename)
  }

  /**
   * Get path for CSV export with timestamp
   */
  getCsvExportPath(timestamp) {
    const filename = `transformed-${this.migrationType}-${timestamp}.csv`
    return join(this.migrationDir, filename)
  }

  /**
   * Get path for SQL export with timestamp
   */
  getSqlExportPath(timestamp) {
    const filename = `transformed-${this.migrationType}-${timestamp}.sql`
    return join(this.migrationDir, filename)
  }

  /**
   * Get path for backup data (source Firebase data)
   */
  getBackupDataPath(timestamp) {
    const filename = `${this.migrationType}-backup-${timestamp}.json`
    return join(this.migrationDir, filename)
  }

  /**
   * Get legacy paths for backward compatibility
   */
  getLegacyValidationReportPath() {
    return join(this.baseBackupDir, 'validation-report.md')
  }

  getLegacyTestResultsPath() {
    return join(process.cwd(), 'test-results.json')
  }

  getLegacyTransformedDataPath() {
    return join(this.baseBackupDir, `transformed-${this.migrationType}.json`)
  }

  /**
   * Get all migration-specific directories
   */
  getMigrationDirectories() {
    return {
      base: this.baseBackupDir,
      migration: this.migrationDir,
      archives: join(this.migrationDir, 'archives'),
      temp: join(this.migrationDir, 'temp')
    }
  }

  /**
   * Create archive directory for old files
   */
  getArchiveDirectory() {
    const archiveDir = join(this.migrationDir, 'archives')
    this.ensureDirectoryExists(archiveDir)
    return archiveDir
  }

  /**
   * Create temporary directory for processing
   */
  getTempDirectory() {
    const tempDir = join(this.migrationDir, 'temp')
    this.ensureDirectoryExists(tempDir)
    return tempDir
  }

  /**
   * Move legacy files to new organized structure
   */
  migrateLegacyFiles() {
    const legacyFiles = [
      {
        old: this.getLegacyValidationReportPath(),
        new: this.getValidationReportPath('legacy')
      },
      {
        old: this.getLegacyTestResultsPath(),
        new: this.getTestResultsPath('legacy')
      },
      {
        old: this.getLegacyTransformedDataPath(),
        new: this.getTransformedDataPath('legacy')
      }
    ]

    const movedFiles = []
    
    legacyFiles.forEach(({ old, new: newPath }) => {
      if (existsSync(old)) {
        try {
          const fs = require('fs')
          fs.renameSync(old, newPath)
          movedFiles.push({ from: old, to: newPath })
          console.log(`📁 Moved legacy file: ${old} → ${newPath}`)
        } catch (error) {
          console.warn(`⚠️  Failed to move legacy file ${old}:`, error.message)
        }
      }
    })

    return movedFiles
  }

  /**
   * Clean up old files (keep only last N versions)
   */
  cleanupOldFiles(keepCount = 5) {
    const fs = require('fs')
    
    if (!existsSync(this.migrationDir)) {
      return
    }

    const files = fs.readdirSync(this.migrationDir)
    const fileGroups = {}

    // Group files by type
    files.forEach(file => {
      const match = file.match(/^(.+)-(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2})-\d{3}Z\.(md|json|csv|sql)$/)
      if (match) {
        const [, prefix, , extension] = match
        const key = `${prefix}.${extension}`
        if (!fileGroups[key]) {
          fileGroups[key] = []
        }
        fileGroups[key].push({
          name: file,
          path: join(this.migrationDir, file),
          mtime: fs.statSync(join(this.migrationDir, file)).mtime
        })
      }
    })

    // Clean up each group
    Object.entries(fileGroups).forEach(([type, files]) => {
      if (files.length > keepCount) {
        // Sort by modification time (newest first)
        files.sort((a, b) => b.mtime - a.mtime)
        
        // Move old files to archive
        const archiveDir = this.getArchiveDirectory()
        const filesToArchive = files.slice(keepCount)
        
        filesToArchive.forEach(file => {
          const archivePath = join(archiveDir, file.name)
          try {
            fs.renameSync(file.path, archivePath)
            console.log(`📦 Archived old file: ${file.name}`)
          } catch (error) {
            console.warn(`⚠️  Failed to archive file ${file.name}:`, error.message)
          }
        })
      }
    })
  }

  /**
   * Get file statistics for the migration type
   */
  getFileStats() {
    const fs = require('fs')
    
    if (!existsSync(this.migrationDir)) {
      return {
        totalFiles: 0,
        totalSize: 0,
        fileTypes: {},
        latestFiles: []
      }
    }

    const files = fs.readdirSync(this.migrationDir)
    const stats = {
      totalFiles: 0,
      totalSize: 0,
      fileTypes: {},
      latestFiles: []
    }

    files.forEach(file => {
      const filePath = join(this.migrationDir, file)
      const fileStat = fs.statSync(filePath)
      
      if (fileStat.isFile()) {
        stats.totalFiles++
        stats.totalSize += fileStat.size
        
        const extension = file.split('.').pop()
        stats.fileTypes[extension] = (stats.fileTypes[extension] || 0) + 1
        
        stats.latestFiles.push({
          name: file,
          size: fileStat.size,
          mtime: fileStat.mtime
        })
      }
    })

    // Sort latest files by modification time
    stats.latestFiles.sort((a, b) => b.mtime - a.mtime)
    stats.latestFiles = stats.latestFiles.slice(0, 10) // Keep only 10 latest

    return stats
  }

  /**
   * Ensure directory exists, create if it doesn't
   */
  ensureDirectoryExists(dirPath) {
    if (!existsSync(dirPath)) {
      mkdirSync(dirPath, { recursive: true })
      console.log(`📁 Created directory: ${dirPath}`)
    }
  }

  /**
   * Get relative path for display purposes
   */
  getRelativePath(absolutePath) {
    return absolutePath.replace(process.cwd() + '/', '')
  }

  /**
   * Generate timestamp string for file naming
   */
  generateTimestamp() {
    return new Date().toISOString().replace(/[:.]/g, '-')
  }
}
