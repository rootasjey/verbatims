/**
 * Authors Migration
 * Handles migration of authors from Firebase to SQLite
 * using the modular migration framework.
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import { BaseMigrator } from '../core/BaseMigrator.js'
import { AuthorsValidator } from '../validators/AuthorsValidator.js'
import { AuthorsTransformer } from '../transformers/AuthorsTransformer.js'

export class AuthorsMigration extends BaseMigrator {
  constructor(options = {}) {
    super('authors', options)
    
    // Set default backup path if not provided
    if (!this.backupPath) {
      this.backupPath = 'server/database/backups/authors-1752638847.json'
    }
    
    this.validator = new AuthorsValidator()
    this.transformer = new AuthorsTransformer()
  }

  /**
   * Load Firebase authors data
   */
  async loadSourceData() {
    try {
      const backupPath = join(process.cwd(), this.backupPath)
      const rawData = readFileSync(backupPath, 'utf-8')
      const firebaseData = JSON.parse(rawData)
      
      // Extract authors data
      const authors = firebaseData.data || firebaseData
      this.stats.totalRecords = Object.keys(authors).length
      
      this.log(`Loaded ${this.stats.totalRecords} authors from ${this.backupPath}`)
      
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
      
      this.log(`Transformed ${this.stats.transformedRecords} authors`)
      
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
      INSERT INTO authors (
        name, bio, birth_date, death_date, nationality, job,
        image_url, website_url, wikipedia_url, is_fictional,
        views_count, quotes_count, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    // Process batch in transaction
    const transaction = db.transaction((records) => {
      for (const record of records) {
        insertStmt.run(
          record.name,
          record.bio,
          record.birth_date,
          record.death_date,
          record.nationality,
          record.job,
          record.image_url,
          record.website_url,
          record.wikipedia_url,
          record.is_fictional || false,
          record.views_count || 0,
          record.quotes_count || 0,
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
    return 'authors'
  }

  /**
   * Generate additional reports specific to authors
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
    let report = `# Authors Quality Metrics Report\n\n`
    report += `**Generated:** ${new Date().toISOString()}\n`
    report += `**Migration Type:** authors\n\n`
    
    report += `## Overview\n\n`
    report += `- **Total Records:** ${metrics.totalRecords}\n`
    report += `- **Completeness Score:** ${metrics.completenessScore.toFixed(1)}%\n`
    report += `- **Quality Score:** ${metrics.qualityScore.toFixed(1)}%\n`
    report += `- **Error Rate:** ${metrics.errorRate.toFixed(1)}%\n`
    report += `- **Warning Rate:** ${metrics.warningRate.toFixed(1)}%\n\n`
    
    report += `## Author Types\n\n`
    report += `- **Real People:** ${metrics.realPercent.toFixed(1)}% (${metrics.realCount})\n`
    report += `- **Fictional Characters:** ${metrics.fictionalPercent.toFixed(1)}% (${metrics.fictionalCount})\n\n`
    
    report += `## Content Analysis\n\n`
    report += `- **Has Biography:** ${metrics.hasBioPercent.toFixed(1)}% (${metrics.hasBio})\n`
    report += `- **Has Image:** ${metrics.hasImagePercent.toFixed(1)}% (${metrics.hasImage})\n`
    report += `- **Has Birth Date:** ${metrics.hasBirthDatePercent.toFixed(1)}% (${metrics.hasBirthDate})\n`
    report += `- **Has Death Date:** ${metrics.hasDeathDatePercent.toFixed(1)}% (${metrics.hasDeathDate})\n`
    report += `- **Has Nationality:** ${metrics.hasNationalityPercent.toFixed(1)}% (${metrics.hasNationality})\n`
    report += `- **Has Job/Profession:** ${metrics.hasJobPercent.toFixed(1)}% (${metrics.hasJob})\n`
    report += `- **Has Website:** ${metrics.hasWebsitePercent.toFixed(1)}% (${metrics.hasWebsite})\n`
    report += `- **Has Wikipedia:** ${metrics.hasWikipediaPercent.toFixed(1)}% (${metrics.hasWikipedia})\n\n`
    
    report += `## Text Metrics\n\n`
    report += `- **Average Name Length:** ${metrics.averageNameLength} characters\n`
    report += `- **Average Bio Length:** ${metrics.averageBioLength} characters\n\n`
    
    if (Object.keys(metrics.nationalityDistribution).length > 0) {
      report += `## Nationality Distribution\n\n`
      Object.entries(metrics.nationalityDistribution)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .forEach(([nationality, count]) => {
          const percentage = ((count / metrics.totalRecords) * 100).toFixed(1)
          report += `- **${nationality}:** ${count} (${percentage}%)\n`
        })
      report += `\n`
    }
    
    if (Object.keys(metrics.jobDistribution).length > 0) {
      report += `## Job/Profession Distribution\n\n`
      Object.entries(metrics.jobDistribution)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .forEach(([job, count]) => {
          const percentage = ((count / metrics.totalRecords) * 100).toFixed(1)
          report += `- **${job}:** ${count} (${percentage}%)\n`
        })
      report += `\n`
    }
    
    if (Object.keys(metrics.centuryDistribution).length > 0) {
      report += `## Historical Distribution\n\n`
      Object.entries(metrics.centuryDistribution)
        .sort(([,a], [,b]) => b - a)
        .forEach(([century, count]) => {
          const percentage = ((count / metrics.totalRecords) * 100).toFixed(1)
          report += `- **${century}:** ${count} (${percentage}%)\n`
        })
      report += `\n`
    }
    
    report += `## Field Completeness\n\n`
    Object.entries(metrics.fieldCompleteness)
      .sort(([,a], [,b]) => b - a)
      .forEach(([field, percentage]) => {
        report += `- **${field}:** ${percentage.toFixed(1)}%\n`
      })
    
    return report
  }
}
