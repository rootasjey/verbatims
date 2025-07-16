/**
 * Quotes Transformer
 * Specialized transformer for quotes migration with
 * quote-specific transformation logic and field mappings.
 */

import { BaseTransformer } from './BaseTransformer.js'

export class QuotesTransformer extends BaseTransformer {
  constructor() {
    super('quotes')
    
    // ID mapping caches for authors and references
    this.authorIdMap = new Map() // Firebase ID -> SQLite ID
    this.referenceIdMap = new Map() // Firebase ID -> SQLite ID
    this.topicsMap = new Map() // Topic name -> Tag ID
    
    // Default values from config
    this.defaultUserId = this.config.config.defaultUserId || 1
    this.defaultStatus = this.config.config.defaultStatus || 'approved'
  }

  /**
   * Initialize ID mappings by loading existing data from database
   */
  async initializeIdMappings() {
    // This would be called before transformation to load existing mappings
    // For now, we'll handle this during transformation
    this.log('Initializing ID mappings for quotes transformation')
  }

  /**
   * Custom transformation logic for quotes
   */
  async transformRecordCustom(firebaseId, firebaseRecord, sqlRecord) {
    // Transform basic quote content
    sqlRecord.name = (firebaseRecord.name || '').trim()
    
    // Validate and set language
    sqlRecord.language = this.transformLanguage(firebaseRecord.language)
    
    // Transform author relationship
    sqlRecord.author_id = await this.transformAuthorId(firebaseRecord.author)
    
    // Transform reference relationship
    sqlRecord.reference_id = await this.transformReferenceId(firebaseRecord.reference)
    
    // Transform user relationship (use default for migration)
    sqlRecord.user_id = this.transformUserId(firebaseRecord.user)
    
    // Set status (existing quotes are approved)
    sqlRecord.status = this.defaultStatus
    
    // Transform metrics
    const metrics = firebaseRecord.metrics || {}
    sqlRecord.likes_count = Math.max(0, parseInt(metrics.likes) || 0)
    sqlRecord.shares_count = Math.max(0, parseInt(metrics.shares) || 0)
    sqlRecord.views_count = 0 // Reset views count for migration
    
    // Set featured status (default to false)
    sqlRecord.is_featured = false
    
    // Transform timestamps
    sqlRecord.created_at = this.transformDate(firebaseRecord.created_at)
    sqlRecord.updated_at = this.transformDate(firebaseRecord.updated_at)
    
    // Store topics for later processing (will be handled in post-processing)
    sqlRecord._topics = firebaseRecord.topics || {}
    
    return sqlRecord
  }

  /**
   * Transform and validate language code
   */
  transformLanguage(language) {
    if (!language) return 'en'
    
    const validLanguages = ['en', 'fr', 'es', 'de', 'it', 'pt', 'ru', 'ja', 'zh']
    const normalizedLang = language.toLowerCase().substring(0, 2)
    
    return validLanguages.includes(normalizedLang) ? normalizedLang : 'en'
  }

  /**
   * Transform author ID from Firebase to SQLite
   */
  async transformAuthorId(author) {
    if (!author || !author.id) {
      return null // No author specified
    }
    
    // Check cache first
    if (this.authorIdMap.has(author.id)) {
      return this.authorIdMap.get(author.id)
    }
    
    // For now, we'll need to implement a lookup mechanism
    // This would query the authors table to find the SQLite ID
    // based on the Firebase ID stored during authors migration
    
    // Placeholder: return null for now, will be handled in the migration class
    this.warnings.push(`Author ID mapping needed for Firebase ID: ${author.id} (${author.name})`)
    return null
  }

  /**
   * Transform reference ID from Firebase to SQLite
   */
  async transformReferenceId(reference) {
    if (!reference || !reference.id) {
      return null // No reference specified
    }
    
    // Check cache first
    if (this.referenceIdMap.has(reference.id)) {
      return this.referenceIdMap.get(reference.id)
    }
    
    // For now, we'll need to implement a lookup mechanism
    // This would query the quote_references table to find the SQLite ID
    // based on the Firebase ID stored during references migration
    
    // Placeholder: return null for now, will be handled in the migration class
    this.warnings.push(`Reference ID mapping needed for Firebase ID: ${reference.id} (${reference.name})`)
    return null
  }

  /**
   * Transform user ID (use default for migration)
   */
  transformUserId(user) {
    // For migration, we'll use a default user ID
    // In a real scenario, we might want to create user mappings
    return this.defaultUserId
  }

  /**
   * Transform date values (handles Firebase timestamp format)
   */
  transformDate(dateValue) {
    if (!dateValue) return null
    
    // Handle Firebase timestamp objects
    if (dateValue.__time__) {
      return new Date(dateValue.__time__).toISOString()
    }
    
    // Handle Firebase timestamp objects (alternative format)
    if (dateValue._seconds) {
      return new Date(dateValue._seconds * 1000).toISOString()
    }
    
    // Handle string dates
    if (typeof dateValue === 'string') {
      const date = new Date(dateValue)
      if (!isNaN(date.getTime())) {
        return date.toISOString()
      }
    }
    
    // Handle numeric timestamps
    if (typeof dateValue === 'number') {
      const date = new Date(dateValue)
      if (!isNaN(date.getTime())) {
        return date.toISOString()
      }
    }
    
    return null
  }

  /**
   * Process topics and convert to tags
   * This will be called after the main transformation
   */
  async processTopicsToTags(transformedRecords) {
    this.log('Processing topics to tags conversion')
    
    const allTopics = new Set()
    
    // Collect all unique topics
    transformedRecords.forEach(record => {
      if (record._topics) {
        Object.keys(record._topics).forEach(topic => {
          if (record._topics[topic] === true) {
            allTopics.add(topic)
          }
        })
      }
    })
    
    this.log(`Found ${allTopics.size} unique topics`)
    
    // Create tags and build mapping
    // This would interact with the database to create tags
    // For now, we'll store the topic information for later processing
    
    return {
      topics: Array.from(allTopics),
      quoteTags: transformedRecords.map(record => ({
        firebase_id: record.firebase_id,
        topics: record._topics ? Object.keys(record._topics).filter(t => record._topics[t] === true) : []
      }))
    }
  }

  /**
   * Set author ID mapping (called from migration class)
   */
  setAuthorIdMapping(firebaseId, sqliteId) {
    this.authorIdMap.set(firebaseId, sqliteId)
  }

  /**
   * Set reference ID mapping (called from migration class)
   */
  setReferenceIdMapping(firebaseId, sqliteId) {
    this.referenceIdMap.set(firebaseId, sqliteId)
  }

  /**
   * Get transformation statistics
   */
  getTransformationStats() {
    return {
      authorMappings: this.authorIdMap.size,
      referenceMappings: this.referenceIdMap.size,
      topicMappings: this.topicsMap.size
    }
  }

  /**
   * Generate CSV export for quotes
   */
  async generateCSV(transformedData, outputPath) {
    const fs = await import('fs')
    
    const headers = [
      'id', 'name', 'language', 'author_id', 'reference_id', 'user_id',
      'status', 'likes_count', 'shares_count', 'views_count', 'is_featured',
      'created_at', 'updated_at'
    ]
    
    let csvContent = headers.join(',') + '\n'
    
    transformedData.forEach(record => {
      const row = headers.map(header => {
        const value = record[header]
        if (value === null || value === undefined) return ''
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      })
      csvContent += row.join(',') + '\n'
    })
    
    await fs.promises.writeFile(outputPath, csvContent, 'utf8')
  }

  /**
   * Generate SQL export for quotes
   */
  async generateSQL(transformedData, outputPath) {
    const fs = await import('fs')
    
    let sqlContent = '-- Quotes Migration SQL Export\n\n'
    sqlContent += 'BEGIN TRANSACTION;\n\n'
    
    transformedData.forEach(record => {
      const columns = []
      const values = []
      
      Object.keys(record).forEach(key => {
        if (key.startsWith('_')) return // Skip internal fields
        
        columns.push(key)
        const value = record[key]
        
        if (value === null || value === undefined) {
          values.push('NULL')
        } else if (typeof value === 'string') {
          values.push(`'${value.replace(/'/g, "''")}'`)
        } else if (typeof value === 'boolean') {
          values.push(value ? '1' : '0')
        } else {
          values.push(value.toString())
        }
      })
      
      sqlContent += `INSERT INTO quotes (${columns.join(', ')}) VALUES (${values.join(', ')});\n`
    })
    
    sqlContent += '\nCOMMIT;\n'
    
    await fs.promises.writeFile(outputPath, sqlContent, 'utf8')
  }
}
