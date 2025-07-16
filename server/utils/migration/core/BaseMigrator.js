/**
 * Base Migration Class
 * Abstract base class for all migration types providing common functionality
 * for data transformation, validation, import, and reporting.
 */

import { writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { FileManager } from './FileManager.js'

export class BaseMigrator {
  constructor(migrationType, options = {}) {
    if (this.constructor === BaseMigrator) {
      throw new Error('BaseMigrator is abstract and cannot be instantiated directly')
    }

    this.migrationType = migrationType
    this.dryRun = options.dryRun || false
    this.batchSize = options.batchSize || 50
    this.verbose = options.verbose || false
    this.backupPath = options.backupPath
    
    this.fileManager = new FileManager(migrationType)
    
    this.stats = {
      totalRecords: 0,
      transformedRecords: 0,
      validRecords: 0,
      importedRecords: 0,
      errors: [],
      warnings: [],
      startTime: null,
      endTime: null
    }
  }

  /**
   * Main migration orchestration method
   */
  async migrate() {
    this.stats.startTime = new Date()
    
    try {
      this.logHeader()
      
      // Step 1: Load and analyze source data
      console.log(`📊 Step 1: Loading ${this.migrationType} data...`)
      const sourceData = await this.loadSourceData()
      
      // Step 2: Transform data
      console.log(`🔄 Step 2: Transforming ${this.migrationType} data...`)
      const transformedData = await this.transformData(sourceData)
      
      // Step 3: Validate data
      console.log(`✅ Step 3: Validating ${this.migrationType} data...`)
      const validationResult = await this.validateData(transformedData)
      
      // Step 4: Import data (if not dry run)
      if (!this.dryRun) {
        console.log(`💾 Step 4: Importing ${this.migrationType} data...`)
        await this.importData(transformedData)
      } else {
        console.log('🔍 Step 4: Skipped (dry run mode)')
      }
      
      // Step 5: Generate reports
      console.log(`📋 Step 5: Generating ${this.migrationType} migration reports...`)
      await this.generateReports(transformedData, validationResult)
      
      this.stats.endTime = new Date()
      console.log(`\n🎉 ${this.migrationType} migration completed successfully!`)
      this.logSummary()
      
    } catch (error) {
      this.stats.endTime = new Date()
      console.error(`\n❌ ${this.migrationType} migration failed:`, error.message)
      if (this.verbose) {
        console.error(error.stack)
      }
      throw error
    }
  }

  /**
   * Abstract methods that must be implemented by subclasses
   */
  
  async loadSourceData() {
    throw new Error('loadSourceData() must be implemented by subclass')
  }

  async transformData(sourceData) {
    throw new Error('transformData() must be implemented by subclass')
  }

  async validateData(transformedData) {
    throw new Error('validateData() must be implemented by subclass')
  }

  async importData(transformedData) {
    throw new Error('importData() must be implemented by subclass')
  }

  getTableName() {
    throw new Error('getTableName() must be implemented by subclass')
  }

  /**
   * Common utility methods
   */
  
  logHeader() {
    console.log(`🚀 Starting ${this.migrationType} Migration`)
    console.log('='.repeat(50))
    console.log(`Migration Type: ${this.migrationType}`)
    console.log(`Mode: ${this.dryRun ? 'DRY RUN' : 'LIVE MIGRATION'}`)
    console.log(`Batch Size: ${this.batchSize}`)
    if (this.backupPath) {
      console.log(`Backup File: ${this.backupPath}`)
    }
    console.log()
  }

  logSummary() {
    const duration = this.stats.endTime - this.stats.startTime
    const durationSeconds = (duration / 1000).toFixed(2)
    
    console.log('\n📊 Migration Summary')
    console.log('='.repeat(30))
    console.log(`Duration: ${durationSeconds}s`)
    console.log(`Total Records: ${this.stats.totalRecords}`)
    console.log(`Transformed: ${this.stats.transformedRecords}`)
    console.log(`Valid: ${this.stats.validRecords}`)
    
    if (!this.dryRun) {
      console.log(`Imported: ${this.stats.importedRecords}`)
      const successRate = this.stats.totalRecords > 0 
        ? ((this.stats.importedRecords / this.stats.totalRecords) * 100).toFixed(1)
        : '0'
      console.log(`Success Rate: ${successRate}%`)
    }
    
    console.log(`Errors: ${this.stats.errors.length}`)
    console.log(`Warnings: ${this.stats.warnings.length}`)
  }

  /**
   * Generate comprehensive migration reports
   */
  async generateReports(transformedData, validationResult) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    
    // Generate validation report
    const validationReport = this.generateValidationReport(validationResult)
    const validationReportPath = this.fileManager.getValidationReportPath(timestamp)
    writeFileSync(validationReportPath, validationReport)
    console.log(`   📋 Validation report: ${validationReportPath}`)
    
    // Generate migration summary report
    const migrationReport = this.generateMigrationReport()
    const migrationReportPath = this.fileManager.getMigrationReportPath(timestamp)
    writeFileSync(migrationReportPath, migrationReport)
    console.log(`   📊 Migration report: ${migrationReportPath}`)
    
    // Save transformed data with timestamp
    const transformedDataPath = this.fileManager.getTransformedDataPath(timestamp)
    writeFileSync(transformedDataPath, JSON.stringify({
      metadata: {
        migrationType: this.migrationType,
        timestamp: new Date().toISOString(),
        totalRecords: transformedData.length,
        dryRun: this.dryRun,
        stats: this.stats
      },
      data: transformedData
    }, null, 2))
    console.log(`   💾 Transformed data: ${transformedDataPath}`)
  }

  generateValidationReport(validationResult) {
    let report = `# ${this.migrationType.charAt(0).toUpperCase() + this.migrationType.slice(1)} Validation Report\n\n`
    report += `**Generated:** ${new Date().toISOString()}\n`
    report += `**Migration Type:** ${this.migrationType}\n\n`
    report += `## Summary\n\n`
    report += `- **Status:** ${validationResult.isValid ? '✅ Valid' : '❌ Invalid'}\n`
    report += `- **Errors:** ${validationResult.errorCount || 0}\n`
    report += `- **Warnings:** ${validationResult.warningCount || 0}\n\n`

    if (validationResult.errors && validationResult.errors.length > 0) {
      report += `## Errors\n\n`
      validationResult.errors.forEach((error, index) => {
        report += `${index + 1}. ${error}\n`
      })
      report += `\n`
    }

    if (validationResult.warnings && validationResult.warnings.length > 0) {
      report += `## Warnings\n\n`
      validationResult.warnings.forEach((warning, index) => {
        report += `${index + 1}. ${warning}\n`
      })
      report += `\n`
    }

    return report
  }

  generateMigrationReport() {
    const duration = this.stats.endTime - this.stats.startTime
    const durationSeconds = (duration / 1000).toFixed(2)
    
    let report = `# ${this.migrationType.charAt(0).toUpperCase() + this.migrationType.slice(1)} Migration Report\n\n`
    report += `**Generated:** ${new Date().toISOString()}\n`
    report += `**Migration Type:** ${this.migrationType}\n`
    report += `**Mode:** ${this.dryRun ? 'DRY RUN' : 'LIVE MIGRATION'}\n`
    report += `**Duration:** ${durationSeconds}s\n\n`
    
    report += `## Statistics\n\n`
    report += `- **Total Records:** ${this.stats.totalRecords}\n`
    report += `- **Transformed Records:** ${this.stats.transformedRecords}\n`
    report += `- **Valid Records:** ${this.stats.validRecords}\n`
    
    if (!this.dryRun) {
      report += `- **Imported Records:** ${this.stats.importedRecords}\n`
      const successRate = this.stats.totalRecords > 0 
        ? ((this.stats.importedRecords / this.stats.totalRecords) * 100).toFixed(1)
        : '0'
      report += `- **Success Rate:** ${successRate}%\n`
    }
    
    report += `- **Errors:** ${this.stats.errors.length}\n`
    report += `- **Warnings:** ${this.stats.warnings.length}\n\n`
    
    if (this.stats.errors.length > 0) {
      report += `## Errors\n\n`
      this.stats.errors.forEach((error, index) => {
        report += `${index + 1}. ${error}\n`
      })
      report += `\n`
    }
    
    return report
  }

  /**
   * Utility method for logging with migration type prefix
   */
  log(message, level = 'info') {
    const prefix = `[${this.migrationType.toUpperCase()}]`
    if (level === 'error') {
      console.error(`${prefix} ${message}`)
    } else if (level === 'warn') {
      console.warn(`${prefix} ${message}`)
    } else {
      console.log(`${prefix} ${message}`)
    }
  }
}
