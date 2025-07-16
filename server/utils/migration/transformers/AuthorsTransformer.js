/**
 * Authors Transformer
 * Specialized transformer for authors migration with
 * author-specific transformation logic and field mappings.
 */

import { BaseTransformer } from './BaseTransformer.js'

export class AuthorsTransformer extends BaseTransformer {
  constructor() {
    super('authors')
  }

  /**
   * Custom transformation logic for authors
   */
  async transformRecordCustom(firebaseId, firebaseRecord, sqlRecord) {
    // Transform basic fields
    sqlRecord.name = (firebaseRecord.name || '').trim().substring(0, 200)
    sqlRecord.bio = firebaseRecord.summary || ''
    
    // Transform dates
    sqlRecord.birth_date = this.transformDate(firebaseRecord.birth?.date)
    sqlRecord.death_date = this.transformDate(firebaseRecord.death?.date)
    sqlRecord.created_at = this.transformDate(firebaseRecord.created_at)
    sqlRecord.updated_at = this.transformDate(firebaseRecord.updated_at)
    
    // Transform nationality (combine city and country)
    sqlRecord.nationality = this.transformNationality(firebaseRecord.birth)
    
    // Transform job/profession
    sqlRecord.job = firebaseRecord.job || ''
    
    // Transform URLs
    sqlRecord.image_url = this.transformImageUrl(firebaseRecord.urls?.image || firebaseRecord.urls?.imageName)
    sqlRecord.website_url = this.transformWebsiteUrl(firebaseRecord.urls?.website)
    sqlRecord.wikipedia_url = this.transformWikipediaUrl(firebaseRecord.urls?.wikipedia)
    
    // Handle fictional status
    sqlRecord.is_fictional = firebaseRecord.is_fictional || false
    
    // Set default values for counters
    sqlRecord.views_count = 0
    sqlRecord.quotes_count = 0
    
    return sqlRecord
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
   * Transform nationality from birth location data
   */
  transformNationality(birthData) {
    if (!birthData) return ''
    
    // Prefer country over city
    if (birthData.country && birthData.country.trim()) {
      return birthData.country.trim()
    }
    
    if (birthData.city && birthData.city.trim()) {
      return birthData.city.trim()
    }
    
    return ''
  }

  /**
   * Transform image URL (handle common Firebase storage issues)
   */
  transformImageUrl(imageValue) {
    if (!imageValue) return ''
    
    const imageStr = imageValue.toString().trim()
    
    // If it's already a valid URL, return as-is
    if (imageStr.startsWith('http://') || imageStr.startsWith('https://')) {
      return imageStr
    }
    
    // If it's just a filename, it's likely from Firebase storage
    // Log as warning since these need to be handled separately
    if (/\.(jpg|jpeg|png|gif|webp)$/i.test(imageStr)) {
      this.warnings.push(`Image filename detected (needs Firebase storage URL): ${imageStr}`)
      return imageStr // Keep the filename for now
    }
    
    return imageStr
  }

  /**
   * Transform website URL
   */
  transformWebsiteUrl(websiteValue) {
    if (!websiteValue) return ''
    
    const websiteStr = websiteValue.toString().trim()
    
    // If it's already a valid URL, return as-is
    if (websiteStr.startsWith('http://') || websiteStr.startsWith('https://')) {
      return websiteStr
    }
    
    // Add https:// if missing
    if (websiteStr && !websiteStr.startsWith('http')) {
      return `https://${websiteStr}`
    }
    
    return websiteStr
  }

  /**
   * Transform Wikipedia URL
   */
  transformWikipediaUrl(wikipediaValue) {
    if (!wikipediaValue) return ''
    
    const wikipediaStr = wikipediaValue.toString().trim()
    
    // If it's already a valid URL, return as-is
    if (wikipediaStr.startsWith('http://') || wikipediaStr.startsWith('https://')) {
      return wikipediaStr
    }
    
    // If it looks like a Wikipedia path, construct full URL
    if (wikipediaStr.startsWith('/wiki/')) {
      return `https://en.wikipedia.org${wikipediaStr}`
    }
    
    return wikipediaStr
  }

  /**
   * Generate CSV output for authors
   */
  async generateCSV(data, outputPath) {
    const headers = [
      'firebase_id', 'name', 'bio', 'birth_date', 'death_date', 'nationality',
      'job', 'image_url', 'website_url', 'wikipedia_url', 'is_fictional',
      'views_count', 'quotes_count', 'created_at', 'updated_at'
    ]
    
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => {
        const value = row[header] || ''
        // Handle boolean values
        const displayValue = typeof value === 'boolean' ? value.toString() : value
        // Escape CSV values
        return `"${String(displayValue).replace(/"/g, '""')}"`
      }).join(','))
    ].join('\n')
    
    const { writeFileSync } = await import('fs')
    writeFileSync(outputPath, csvContent)
    this.log(`CSV file generated: ${outputPath}`)
  }

  /**
   * Generate SQL INSERT statements for authors
   */
  async generateSQL(data, outputPath) {
    const sqlStatements = [
      '-- Firebase Authors Import',
      '-- Generated at: ' + new Date().toISOString(),
      '',
      'BEGIN TRANSACTION;',
      ''
    ]
    
    data.forEach(row => {
      const values = [
        `'${this.escapeSql(row.name)}'`,
        `'${this.escapeSql(row.bio)}'`,
        row.birth_date ? `'${row.birth_date}'` : 'NULL',
        row.death_date ? `'${row.death_date}'` : 'NULL',
        `'${this.escapeSql(row.nationality)}'`,
        `'${this.escapeSql(row.job)}'`,
        `'${this.escapeSql(row.image_url)}'`,
        `'${this.escapeSql(row.website_url)}'`,
        `'${this.escapeSql(row.wikipedia_url)}'`,
        row.is_fictional ? 'TRUE' : 'FALSE',
        row.views_count || 0,
        row.quotes_count || 0,
        `'${row.created_at}'`,
        `'${row.updated_at}'`
      ]
      
      sqlStatements.push(
        `INSERT INTO authors (name, bio, birth_date, death_date, nationality, job, image_url, website_url, wikipedia_url, is_fictional, views_count, quotes_count, created_at, updated_at) VALUES (${values.join(', ')});`
      )
    })
    
    sqlStatements.push('')
    sqlStatements.push('COMMIT;')
    
    const { writeFileSync } = await import('fs')
    writeFileSync(outputPath, sqlStatements.join('\n'))
    this.log(`SQL file generated: ${outputPath}`)
  }

  /**
   * Escape SQL string values
   */
  escapeSql(value) {
    if (!value) return ''
    return String(value).replace(/'/g, "''")
  }

  /**
   * Extract data array from Firebase backup structure
   */
  extractDataArray(firebaseData) {
    // Handle Firebase backup structure for authors
    if (firebaseData.data) {
      return firebaseData.data
    } else if (Array.isArray(firebaseData)) {
      return firebaseData
    } else {
      // Assume it's a direct object with record IDs as keys
      return firebaseData
    }
  }

  /**
   * Transform a single Firebase record to SQL format
   */
  async transformRecord(firebaseId, firebaseRecord) {
    if (!firebaseRecord || typeof firebaseRecord !== 'object') {
      throw new Error('Firebase record must be an object')
    }

    // Start with base transformation
    const sqlRecord = {
      firebase_id: firebaseId // Keep reference to original Firebase ID
    }

    // Apply custom transformation
    const transformedRecord = await this.transformRecordCustom(firebaseId, firebaseRecord, sqlRecord)

    // Validate transformed record structure
    this.validateTransformedRecord(transformedRecord, firebaseId)

    return transformedRecord
  }

  /**
   * Validate transformed record structure
   */
  validateTransformedRecord(record, firebaseId) {
    const requiredFields = this.config.getRequiredFields()
    
    requiredFields.forEach(field => {
      if (record[field] === undefined || record[field] === null || record[field] === '') {
        throw new Error(`Missing required field '${field}' in transformed author record ${firebaseId}`)
      }
    })
  }
}
