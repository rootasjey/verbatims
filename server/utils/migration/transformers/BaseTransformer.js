/**
 * Base Transformer Class
 * Abstract base class for migration-specific data transformation.
 * Handles Firebase to SQL data transformation with common utilities.
 */

import { MigrationConfig } from '../core/MigrationConfig.js'

export class BaseTransformer {
  constructor(migrationType) {
    if (this.constructor === BaseTransformer) {
      throw new Error('BaseTransformer is abstract and cannot be instantiated directly')
    }

    this.migrationType = migrationType
    this.config = new MigrationConfig(migrationType)
    this.errors = []
    this.warnings = []
    this.verbose = false
  }

  /**
   * Transform Firebase data to SQL format
   */
  async transformData(firebaseData, options = {}) {
    this.verbose = options.verbose || false
    this.errors = []
    this.warnings = []

    if (!firebaseData || typeof firebaseData !== 'object') {
      throw new Error('Firebase data must be an object')
    }

    // Extract data from Firebase backup structure
    const dataObject = this.extractDataArray(firebaseData)

    // Convert to entries for processing
    const dataEntries = Array.isArray(dataObject)
      ? dataObject.map((item, index) => [index.toString(), item])
      : Object.entries(dataObject)

    this.log(`Starting transformation of ${dataEntries.length} ${this.migrationType} records`)

    const transformedRecords = []
    let successCount = 0
    let errorCount = 0

    // Transform each record
    for (const [firebaseId, firebaseRecord] of dataEntries) {
      try {
        const transformedRecord = await this.transformRecord(firebaseId, firebaseRecord)
        if (transformedRecord) {
          transformedRecords.push(transformedRecord)
          successCount++
        }
      } catch (error) {
        errorCount++
        this.errors.push(`Failed to transform record ${firebaseId}: ${error.message}`)
        this.log(`Error transforming record ${firebaseId}: ${error.message}`, 'error')
      }
    }

    this.log(`Transformation complete: ${successCount} success, ${errorCount} errors, ${this.warnings.length} warnings`)

    return {
      data: transformedRecords,
      metadata: {
        migrationType: this.migrationType,
        totalRecords: dataEntries.length,
        transformedRecords: transformedRecords.length,
        successCount,
        errorCount,
        warningCount: this.warnings.length,
        errors: this.errors,
        warnings: this.warnings,
        timestamp: new Date().toISOString()
      }
    }
  }

  /**
   * Extract data array from Firebase backup structure
   */
  extractDataArray(firebaseData) {
    // Handle different Firebase backup structures
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

    // Apply field mappings
    const mappings = this.config.getAllMappings()
    Object.entries(mappings).forEach(([firebaseField, sqlField]) => {
      const value = this.getNestedValue(firebaseRecord, firebaseField)
      if (value !== undefined) {
        sqlRecord[sqlField] = this.transformFieldValue(sqlField, value, firebaseRecord)
      }
    })

    // Apply default values for missing fields
    this.applyDefaultValues(sqlRecord)

    // Custom transformation logic (to be implemented by subclasses)
    const customTransformed = await this.transformRecordCustom(firebaseId, firebaseRecord, sqlRecord)

    // Validate transformed record structure
    this.validateTransformedRecord(customTransformed, firebaseId)

    return customTransformed
  }

  /**
   * Custom transformation logic (to be implemented by subclasses)
   */
  async transformRecordCustom(firebaseId, firebaseRecord, sqlRecord) {
    return sqlRecord // Default: return as-is
  }

  /**
   * Transform individual field values
   */
  transformFieldValue(fieldName, value, originalRecord) {
    const fieldRules = this.config.getFieldValidation(fieldName)
    
    if (value === null || value === undefined) {
      return fieldRules?.default || null
    }

    // Type-specific transformations
    switch (fieldRules?.type) {
      case 'string':
        return this.transformStringValue(value, fieldRules)
      
      case 'integer':
        return this.transformIntegerValue(value, fieldRules)
      
      case 'date':
        return this.transformDateValue(value)
      
      case 'url':
        return this.transformUrlValue(value)
      
      case 'json':
        return this.transformJsonValue(value)
      
      case 'enum':
        return this.transformEnumValue(value, fieldRules)
      
      default:
        return value
    }
  }

  /**
   * Transform string values
   */
  transformStringValue(value, rules) {
    let stringValue = String(value).trim()
    
    if (rules.maxLength && stringValue.length > rules.maxLength) {
      this.warnings.push(`String value truncated to ${rules.maxLength} characters: "${stringValue.substring(0, 50)}..."`)
      stringValue = stringValue.substring(0, rules.maxLength)
    }
    
    return stringValue
  }

  /**
   * Transform integer values
   */
  transformIntegerValue(value, rules) {
    const intValue = parseInt(value, 10)
    
    if (isNaN(intValue)) {
      return rules.default || 0
    }
    
    if (rules.min !== undefined && intValue < rules.min) {
      return rules.min
    }
    
    if (rules.max !== undefined && intValue > rules.max) {
      return rules.max
    }
    
    return intValue
  }

  /**
   * Transform date values
   */
  transformDateValue(value) {
    if (!value) return null
    
    // Handle Firebase timestamp objects
    if (value._seconds) {
      return new Date(value._seconds * 1000).toISOString().split('T')[0]
    }
    
    // Handle various date formats
    const date = new Date(value)
    if (isNaN(date.getTime())) {
      this.warnings.push(`Invalid date value: ${value}`)
      return null
    }
    
    return date.toISOString().split('T')[0]
  }

  /**
   * Transform URL values
   */
  transformUrlValue(value) {
    if (!value) return null
    
    const stringValue = String(value).trim()
    
    // Add protocol if missing
    if (stringValue && !stringValue.startsWith('http://') && !stringValue.startsWith('https://')) {
      return `https://${stringValue}`
    }
    
    return stringValue
  }

  /**
   * Transform JSON values
   */
  transformJsonValue(value) {
    if (!value) return '[]'
    
    if (typeof value === 'string') {
      try {
        JSON.parse(value)
        return value
      } catch {
        this.warnings.push(`Invalid JSON value, converting to array: ${value}`)
        return JSON.stringify([value])
      }
    }
    
    if (typeof value === 'object') {
      return JSON.stringify(value)
    }
    
    return JSON.stringify([value])
  }

  /**
   * Transform enum values
   */
  transformEnumValue(value, rules) {
    const stringValue = String(value).toLowerCase().trim()
    
    if (rules.values.includes(stringValue)) {
      return stringValue
    }
    
    // Try to find a close match
    const closeMatch = rules.values.find(validValue => 
      validValue.includes(stringValue) || stringValue.includes(validValue)
    )
    
    if (closeMatch) {
      this.warnings.push(`Enum value '${value}' mapped to '${closeMatch}'`)
      return closeMatch
    }
    
    this.warnings.push(`Unknown enum value '${value}', using default`)
    return rules.values[0] || 'other'
  }

  /**
   * Apply default values for missing fields
   */
  applyDefaultValues(sqlRecord) {
    const allFields = this.config.getAllFields()
    
    allFields.forEach(field => {
      if (sqlRecord[field] === undefined) {
        const fieldRules = this.config.getFieldValidation(field)
        if (fieldRules?.default !== undefined) {
          sqlRecord[field] = fieldRules.default
        }
      }
    })
  }

  /**
   * Validate transformed record structure
   */
  validateTransformedRecord(record, firebaseId) {
    const requiredFields = this.config.getRequiredFields()
    
    requiredFields.forEach(field => {
      if (record[field] === undefined || record[field] === null || record[field] === '') {
        throw new Error(`Missing required field '${field}' in transformed record ${firebaseId}`)
      }
    })
  }

  /**
   * Get nested value from object using dot notation
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined
    }, obj)
  }

  /**
   * Utility logging method
   */
  log(message, level = 'info') {
    if (!this.verbose && level === 'info') return
    
    const prefix = `[${this.migrationType.toUpperCase()}-TRANSFORM]`
    if (level === 'error') {
      console.error(`${prefix} ${message}`)
    } else if (level === 'warn') {
      console.warn(`${prefix} ${message}`)
    } else {
      console.log(`${prefix} ${message}`)
    }
  }

  /**
   * Generate transformation summary
   */
  getTransformationSummary() {
    return {
      migrationType: this.migrationType,
      errorCount: this.errors.length,
      warningCount: this.warnings.length,
      errors: this.errors,
      warnings: this.warnings
    }
  }
}
