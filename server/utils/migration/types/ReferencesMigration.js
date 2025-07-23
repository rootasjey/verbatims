/**
 * References Migration
 * Handles migration of quote references from Firebase to SQLite
 * using the modular migration framework.
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import { BaseMigrator } from '../core/BaseMigrator.js'
import { ReferencesValidator } from '../validators/ReferencesValidator.js'
import { ReferencesTransformer } from '../transformers/ReferencesTransformer.js'

export class ReferencesMigration extends BaseMigrator {
  constructor(options = {}) {
    super('references', options)
    
    // Set default backup path if not provided
    if (!this.backupPath) {
      this.backupPath = 'server/database/backups/references-1752639132.json'
    }
    
    this.validator = new ReferencesValidator()
    this.transformer = new ReferencesTransformer()
  }

  /**
   * Load Firebase references data
   */
  async loadSourceData() {
    try {
      const backupPath = join(process.cwd(), this.backupPath)
      const rawData = readFileSync(backupPath, 'utf-8')
      const firebaseData = JSON.parse(rawData)
      
      // Extract references data
      const references = firebaseData.data || firebaseData
      this.stats.totalRecords = Object.keys(references).length
      
      this.log(`Loaded ${this.stats.totalRecords} references from ${this.backupPath}`)
      
      return firebaseData
      
    } catch (error) {
      throw new Error(`Failed to load Firebase data: ${error.message}`)
    }
  }

  /**
   * Transform Firebase data to SQL format
   */
  async transformData(sourceData) {
    try {
      const transformResult = await this.transformer.transformData(sourceData, {
        verbose: this.verbose
      })
      
      this.stats.transformedRecords = transformResult.data.length
      this.stats.errors.push(...transformResult.metadata.errors)
      this.stats.warnings.push(...transformResult.metadata.warnings)
      
      this.log(`Transformed ${this.stats.transformedRecords} references`)
      
      return transformResult.data
      
    } catch (error) {
      throw new Error(`Failed to transform data: ${error.message}`)
    }
  }

  /**
   * Validate transformed data
   */
  async validateData(transformedData) {
    try {
      this.log(`Validating ${Array.isArray(transformedData) ? transformedData.length : 'non-array'} records`)
      this.log(`Data type: ${typeof transformedData}, isArray: ${Array.isArray(transformedData)}`)

      const validationResult = this.validator.validateRecords(transformedData)

      this.stats.validRecords = transformedData.length - (validationResult.errorCount || 0)

      // Safely add warnings and errors
      if (validationResult.warnings && Array.isArray(validationResult.warnings)) {
        this.stats.warnings.push(...validationResult.warnings)
      }
      if (validationResult.errors && Array.isArray(validationResult.errors)) {
        this.stats.errors.push(...validationResult.errors)
      }
      
      this.log(`Validation completed: ${this.stats.validRecords}/${transformedData.length} valid records`)
      this.log(`Warnings: ${validationResult.warningCount}, Errors: ${validationResult.errorCount}`)
      
      return validationResult
      
    } catch (error) {
      throw new Error(`Failed to validate data: ${error.message}`)
    }
  }

  /**
   * Import data into database
   */
  async importData(transformedData) {
    try {
      // Import using the existing API endpoint logic
      const { importReferences } = await import('../../../api/admin/import/references.post.ts')
      
      // Process in batches
      const batchSize = this.batchSize
      let importedCount = 0
      
      for (let i = 0; i < transformedData.length; i += batchSize) {
        const batch = transformedData.slice(i, i + batchSize)
        
        try {
          await this.processBatch(batch)
          importedCount += batch.length
          
          this.log(`Imported batch ${Math.floor(i / batchSize) + 1}: ${batch.length} records`)
          
        } catch (error) {
          this.stats.errors.push(`Batch import failed at record ${i}: ${error.message}`)
          this.log(`Batch import failed: ${error.message}`, 'error')
        }
      }
      
      this.stats.importedRecords = importedCount
      this.log(`Import completed: ${importedCount} records imported`)
      
    } catch (error) {
      throw new Error(`Failed to import data: ${error.message}`)
    }
  }

  /**
   * Process a batch of records for import
   */
  async processBatch(batch) {
    // Get database connection (using NuxtHub/Cloudflare D1)
    const db = hubDatabase()
    
    // Prepare insert statement
    const insertStmt = db.prepare(`
      INSERT INTO quote_references (
        name, original_language, release_date, description, primary_type, secondary_type,
        image_url, urls, views_count, likes_count, shares_count,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    // Process batch in transaction
    const transaction = db.transaction((records) => {
      for (const record of records) {
        insertStmt.run(
          record.name,
          record.original_language,
          record.release_date,
          record.description,
          record.primary_type,
          record.secondary_type,
          record.image_url,
          record.urls,
          record.views_count || 0,
          record.likes_count || 0,
          record.shares_count || 0,
          record.created_at,
          record.updated_at
        )
      }
    })

    transaction(batch)
  }

  /**
   * Get table name for this migration
   */
  getTableName() {
    return 'quote_references'
  }

  /**
   * Generate additional reports specific to references
   */
  async generateReports(transformedData, validationResult) {
    // Call parent method first
    await super.generateReports(transformedData, validationResult)
    
    // Generate additional CSV and SQL files
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    
    // Generate CSV export
    const csvPath = this.fileManager.getCsvExportPath(timestamp)
    await this.transformer.generateCSV(transformedData, csvPath)
    console.log(`   📊 CSV export: ${csvPath}`)

    // Generate SQL export
    const sqlPath = this.fileManager.getSqlExportPath(timestamp)
    await this.transformer.generateSQL(transformedData, sqlPath)
    console.log(`   💾 SQL export: ${sqlPath}`)
    
    // Generate quality metrics report
    const qualityMetrics = this.validator.getQualityMetrics(transformedData)
    const qualityReportPath = this.fileManager.getMigrationReportPath(`quality-${timestamp}`)
    const qualityReport = this.generateQualityReport(qualityMetrics)
    
    const { writeFileSync } = await import('fs')
    writeFileSync(qualityReportPath, qualityReport)
    console.log(`   📈 Quality report: ${qualityReportPath}`)
  }

  /**
   * Generate quality metrics report
   */
  generateQualityReport(metrics) {
    let report = `# References Quality Metrics Report\n\n`
    report += `**Generated:** ${new Date().toISOString()}\n`
    report += `**Migration Type:** references\n\n`
    
    report += `## Overview\n\n`
    report += `- **Total Records:** ${metrics.totalRecords}\n`
    report += `- **Completeness Score:** ${metrics.completenessScore.toFixed(1)}%\n`
    report += `- **Quality Score:** ${metrics.qualityScore.toFixed(1)}%\n`
    report += `- **Error Rate:** ${metrics.errorRate.toFixed(1)}%\n`
    report += `- **Warning Rate:** ${metrics.warningRate.toFixed(1)}%\n\n`
    
    report += `## Content Analysis\n\n`
    report += `- **Has Description:** ${metrics.hasDescriptionPercent.toFixed(1)}% (${metrics.hasDescription})\n`
    report += `- **Has Image:** ${metrics.hasImagePercent.toFixed(1)}% (${metrics.hasImage})\n\n`
    
    report += `## Text Metrics\n\n`
    report += `- **Average Name Length:** ${metrics.averageNameLength} characters\n`
    report += `- **Average Description Length:** ${metrics.averageDescriptionLength} characters\n\n`
    
    report += `## Media Type Distribution\n\n`
    Object.entries(metrics.mediaTypeDistribution)
      .sort(([,a], [,b]) => b - a)
      .forEach(([type, count]) => {
        const percentage = ((count / metrics.totalRecords) * 100).toFixed(1)
        report += `- **${type}:** ${count} (${percentage}%)\n`
      })
    
    report += `\n## Field Completeness\n\n`
    Object.entries(metrics.fieldCompleteness)
      .sort(([,a], [,b]) => b - a)
      .forEach(([field, percentage]) => {
        report += `- **${field}:** ${percentage.toFixed(1)}%\n`
      })
    
    return report
  }
}
