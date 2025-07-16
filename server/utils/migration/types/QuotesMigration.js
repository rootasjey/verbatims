/**
 * Quotes Migration
 * Handles migration of quotes from Firebase to SQLite
 * using the modular migration framework.
 * Supports multiple JSON files and complex ID mappings.
 */

import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import { BaseMigrator } from '../core/BaseMigrator.js'
import { QuotesValidator } from '../validators/QuotesValidator.js'
import { QuotesTransformer } from '../transformers/QuotesTransformer.js'

export class QuotesMigration extends BaseMigrator {
  constructor(options = {}) {
    super('quotes', options)
    
    // Set default backup path pattern if not provided
    if (!this.backupPath) {
      this.backupPath = 'server/database/backups/quotes_part_*.json'
    }
    
    this.validator = new QuotesValidator()
    this.transformer = new QuotesTransformer()
    
    // ID mapping tables
    this.authorIdMappings = new Map()
    this.referenceIdMappings = new Map()
    this.tagMappings = new Map()
  }

  /**
   * Load Firebase quotes data from multiple JSON files
   */
  async loadSourceData() {
    try {
      const backupDir = join(process.cwd(), 'server/database/backups')
      const files = readdirSync(backupDir)
        .filter(file => file.startsWith('quotes_part_') && file.endsWith('.json'))
        .sort() // Ensure consistent ordering
      
      if (files.length === 0) {
        throw new Error('No quotes backup files found matching pattern quotes_part_*.json')
      }
      
      this.log(`Found ${files.length} quotes backup files`)
      
      // Combine data from all files
      const combinedData = { data: {} }
      let totalRecords = 0
      
      for (const file of files) {
        const filePath = join(backupDir, file)
        this.log(`Loading ${file}...`)
        
        const rawData = readFileSync(filePath, 'utf-8')
        const fileData = JSON.parse(rawData)
        
        // Extract quotes data and merge
        const quotes = fileData.data || fileData
        const recordCount = Object.keys(quotes).length
        
        Object.assign(combinedData.data, quotes)
        totalRecords += recordCount
        
        this.log(`  Loaded ${recordCount} quotes from ${file}`)
      }
      
      this.stats.totalRecords = totalRecords
      this.log(`Total loaded: ${totalRecords} quotes from ${files.length} files`)
      
      return combinedData
      
    } catch (error) {
      throw new Error(`Failed to load Firebase data: ${error.message}`)
    }
  }

  /**
   * Transform Firebase data to SQL format
   */
  async transformData(sourceData) {
    try {
      // Initialize ID mappings before transformation
      await this.initializeIdMappings()
      
      const transformResult = await this.transformer.transformData(sourceData, {
        verbose: this.verbose
      })
      
      this.stats.transformedRecords = transformResult.data.length
      this.stats.errors.push(...transformResult.metadata.errors)
      this.stats.warnings.push(...transformResult.metadata.warnings)
      
      this.log(`Transformed ${this.stats.transformedRecords} quotes`)
      
      // Process topics to tags after transformation
      const topicsResult = await this.transformer.processTopicsToTags(transformResult.data)
      this.topicsData = topicsResult
      
      this.log(`Processed ${topicsResult.topics.length} unique topics`)
      
      return transformResult.data
      
    } catch (error) {
      throw new Error(`Failed to transform data: ${error.message}`)
    }
  }

  /**
   * Initialize ID mappings by querying existing data
   */
  async initializeIdMappings() {
    this.log('Initializing ID mappings...')
    
    try {
      // Load author mappings
      await this.loadAuthorMappings()
      
      // Load reference mappings
      await this.loadReferenceMappings()
      
      this.log(`Loaded ${this.authorIdMappings.size} author mappings, ${this.referenceIdMappings.size} reference mappings`)
      
    } catch (error) {
      this.log(`Warning: Could not load ID mappings: ${error.message}`)
      // Continue without mappings - IDs will be null
    }
  }

  /**
   * Load author ID mappings from database
   */
  async loadAuthorMappings() {
    // This would query the authors table to get Firebase ID -> SQLite ID mappings
    // For now, we'll implement a placeholder
    this.log('Author ID mappings would be loaded from database here')
    
    // TODO: Implement actual database query
    // const db = await this.getDatabase()
    // const authors = await db.all('SELECT id, firebase_id FROM authors WHERE firebase_id IS NOT NULL')
    // authors.forEach(author => {
    //   this.authorIdMappings.set(author.firebase_id, author.id)
    //   this.transformer.setAuthorIdMapping(author.firebase_id, author.id)
    // })
  }

  /**
   * Load reference ID mappings from database
   */
  async loadReferenceMappings() {
    // This would query the quote_references table to get Firebase ID -> SQLite ID mappings
    // For now, we'll implement a placeholder
    this.log('Reference ID mappings would be loaded from database here')
    
    // TODO: Implement actual database query
    // const db = await this.getDatabase()
    // const references = await db.all('SELECT id, firebase_id FROM quote_references WHERE firebase_id IS NOT NULL')
    // references.forEach(ref => {
    //   this.referenceIdMappings.set(ref.firebase_id, ref.id)
    //   this.transformer.setReferenceIdMapping(ref.firebase_id, ref.id)
    // })
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
    if (this.dryRun) {
      this.log('Skipping database import (dry run mode)')
      return
    }

    try {
      this.log('Starting database import...')
      
      // Import quotes in batches
      await this.importQuotes(transformedData)
      
      // Import tags and quote-tag relationships
      await this.importTagsAndRelationships()
      
      this.stats.importedRecords = transformedData.length
      this.log(`Successfully imported ${this.stats.importedRecords} quotes`)
      
    } catch (error) {
      throw new Error(`Failed to import data: ${error.message}`)
    }
  }

  /**
   * Import quotes into database
   */
  async importQuotes(transformedData) {
    // This would implement the actual database insertion
    // For now, we'll implement a placeholder
    this.log(`Would import ${transformedData.length} quotes to database`)
    
    // TODO: Implement actual database insertion
    // const db = await this.getDatabase()
    // 
    // for (let i = 0; i < transformedData.length; i += this.batchSize) {
    //   const batch = transformedData.slice(i, i + this.batchSize)
    //   
    //   for (const quote of batch) {
    //     // Remove internal fields
    //     const { _topics, ...quoteData } = quote
    //     
    //     await db.run(`
    //       INSERT INTO quotes (name, language, author_id, reference_id, user_id, status, 
    //                          likes_count, shares_count, views_count, is_featured, 
    //                          created_at, updated_at)
    //       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    //     `, [
    //       quoteData.name, quoteData.language, quoteData.author_id, quoteData.reference_id,
    //       quoteData.user_id, quoteData.status, quoteData.likes_count, quoteData.shares_count,
    //       quoteData.views_count, quoteData.is_featured, quoteData.created_at, quoteData.updated_at
    //     ])
    //   }
    //   
    //   this.log(`Imported batch ${Math.floor(i / this.batchSize) + 1}`)
    // }
  }

  /**
   * Import tags and quote-tag relationships
   */
  async importTagsAndRelationships() {
    if (!this.topicsData) {
      this.log('No topics data to import')
      return
    }
    
    this.log(`Would import ${this.topicsData.topics.length} tags and relationships`)
    
    // TODO: Implement actual tag and relationship insertion
    // 1. Create tags that don't exist
    // 2. Create quote_tags relationships
  }

  /**
   * Get table name for this migration
   */
  getTableName() {
    return 'quotes'
  }

  /**
   * Generate additional reports specific to quotes
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
    
    // Generate topics report
    await this.generateTopicsReport(timestamp)
  }

  /**
   * Generate topics analysis report
   */
  async generateTopicsReport(timestamp) {
    if (!this.topicsData) return
    
    const reportPath = this.fileManager.getValidationReportPath(`topics-${timestamp}`)
    
    let report = '# Topics Analysis Report\n\n'
    report += `Generated: ${new Date().toISOString()}\n\n`
    report += `## Summary\n\n`
    report += `- Total unique topics: ${this.topicsData.topics.length}\n`
    report += `- Quotes with topics: ${this.topicsData.quoteTags.filter(q => q.topics.length > 0).length}\n\n`
    report += `## Topics List\n\n`
    
    this.topicsData.topics.sort().forEach(topic => {
      const count = this.topicsData.quoteTags.filter(q => q.topics.includes(topic)).length
      report += `- ${topic}: ${count} quotes\n`
    })
    
    const fs = await import('fs')
    await fs.promises.writeFile(reportPath, report, 'utf8')
    console.log(`   📋 Topics report: ${reportPath}`)
  }
}
