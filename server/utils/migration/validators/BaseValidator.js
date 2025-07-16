/**
 * Base Validator Class
 * Abstract base class for migration-specific data validation.
 * Provides common validation utilities and structure.
 */

import { MigrationConfig } from '../core/MigrationConfig.js'

export class BaseValidator {
  constructor(migrationType) {
    if (this.constructor === BaseValidator) {
      throw new Error('BaseValidator is abstract and cannot be instantiated directly')
    }

    this.migrationType = migrationType
    this.config = new MigrationConfig(migrationType)
    this.validationErrors = []
    this.validationWarnings = []
  }

  /**
   * Validate an array of records
   */
  validateRecords(records) {
    this.validationErrors = []
    this.validationWarnings = []

    if (!Array.isArray(records)) {
      this.validationErrors.push('Records must be an array')
      return this.getValidationSummary()
    }

    if (records.length === 0) {
      this.validationWarnings.push('No records to validate')
      return this.getValidationSummary()
    }

    // Validate each record
    records.forEach((record, index) => {
      try {
        const result = this.validateRecord(record, index)
        if (!result || !result.errors || !result.warnings) {
          console.error(`Invalid validation result for record ${index}:`, result)
          throw new Error(`validateRecord returned invalid result for record ${index}`)
        }
        const { errors, warnings } = result
        this.validationErrors.push(...errors)
        this.validationWarnings.push(...warnings)
      } catch (error) {
        console.error(`Error validating record ${index}:`, error)
        throw error
      }
    })

    // Cross-record validations
    this.validateDuplicates(records)
    this.validateDataConsistency(records)

    return this.getValidationSummary()
  }

  /**
   * Validate a single record
   */
  validateRecord(record, index) {
    const errors = []
    const warnings = []
    const context = `Record ${index + 1}`

    if (!record || typeof record !== 'object') {
      errors.push(`${context}: Record must be an object`)
      return { errors, warnings }
    }

    // Validate required fields
    const requiredFields = this.config.getRequiredFields()
    requiredFields.forEach(field => {
      if (record[field] === undefined || record[field] === null || record[field] === '') {
        errors.push(`${context}: Missing required field '${field}'`)
      }
    })

    // Validate all present fields
    Object.entries(record).forEach(([field, value]) => {
      const fieldValidation = this.config.validateField(field, value)
      
      if (!fieldValidation.isValid) {
        fieldValidation.errors.forEach(error => {
          errors.push(`${context}: ${error}`)
        })
      }
      
      fieldValidation.warnings.forEach(warning => {
        warnings.push(`${context}: ${warning}`)
      })
    })

    // Custom validation (to be implemented by subclasses)
    const customValidation = this.validateRecordCustom(record, index)
    errors.push(...customValidation.errors)
    warnings.push(...customValidation.warnings)

    return { errors, warnings }
  }

  /**
   * Custom validation method to be implemented by subclasses
   */
  validateRecordCustom(record, index) {
    return { errors: [], warnings: [] }
  }

  /**
   * Validate for duplicate records
   */
  validateDuplicates(records) {
    const seen = new Map()
    const duplicateFields = this.getDuplicateCheckFields()

    records.forEach((record, index) => {
      duplicateFields.forEach(field => {
        if (record[field]) {
          const value = record[field].toString().toLowerCase().trim()
          if (seen.has(`${field}:${value}`)) {
            this.validationWarnings.push(
              `Duplicate ${field} found: "${record[field]}" (records ${seen.get(`${field}:${value}`)} and ${index + 1})`
            )
          } else {
            seen.set(`${field}:${value}`, index + 1)
          }
        }
      })
    })
  }

  /**
   * Get fields to check for duplicates (to be overridden by subclasses)
   */
  getDuplicateCheckFields() {
    return ['name'] // Default to checking name field
  }

  /**
   * Validate data consistency across records
   */
  validateDataConsistency(records) {
    // Check for unusual patterns
    const distributions = this.analyzeDistributions(records)
    
    // Warn about unusual distributions
    Object.entries(distributions).forEach(([field, distribution]) => {
      const totalRecords = records.length
      Object.entries(distribution).forEach(([value, count]) => {
        const percentage = (count / totalRecords) * 100
        if (percentage > 70) {
          this.validationWarnings.push(
            `High concentration of ${field} value '${value}' (${percentage.toFixed(1)}%)`
          )
        }
      })
    })

    // Custom consistency validation
    this.validateConsistencyCustom(records)
  }

  /**
   * Custom consistency validation (to be implemented by subclasses)
   */
  validateConsistencyCustom(records) {
    // Override in subclasses
  }

  /**
   * Analyze field value distributions
   */
  analyzeDistributions(records) {
    const distributions = {}
    const fieldsToAnalyze = this.getDistributionAnalysisFields()

    fieldsToAnalyze.forEach(field => {
      distributions[field] = {}
      records.forEach(record => {
        if (record[field]) {
          const value = record[field].toString()
          distributions[field][value] = (distributions[field][value] || 0) + 1
        }
      })
    })

    return distributions
  }

  /**
   * Get fields to analyze for distribution (to be overridden by subclasses)
   */
  getDistributionAnalysisFields() {
    return [] // Override in subclasses
  }

  /**
   * Utility validation methods
   */
  isValidDate(dateString) {
    if (!dateString) return false
    const date = new Date(dateString)
    return !isNaN(date.getTime()) && date.toISOString().startsWith(dateString.substring(0, 10))
  }

  isValidUrl(url) {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  isValidJson(str) {
    try {
      JSON.parse(str)
      return true
    } catch {
      return false
    }
  }

  /**
   * Get validation summary
   */
  getValidationSummary() {
    return {
      isValid: this.validationErrors.length === 0,
      errorCount: this.validationErrors.length,
      warningCount: this.validationWarnings.length,
      errors: this.validationErrors,
      warnings: this.validationWarnings
    }
  }

  /**
   * Generate validation report
   */
  generateReport() {
    const summary = this.getValidationSummary()
    
    let report = `# ${this.migrationType.charAt(0).toUpperCase() + this.migrationType.slice(1)} Validation Report\n\n`
    report += `**Generated:** ${new Date().toISOString()}\n`
    report += `**Migration Type:** ${this.migrationType}\n\n`
    report += `## Summary\n\n`
    report += `- **Status:** ${summary.isValid ? '✅ Valid' : '❌ Invalid'}\n`
    report += `- **Errors:** ${summary.errorCount}\n`
    report += `- **Warnings:** ${summary.warningCount}\n\n`

    if (summary.errors.length > 0) {
      report += `## Errors\n\n`
      summary.errors.forEach((error, index) => {
        report += `${index + 1}. ${error}\n`
      })
      report += `\n`
    }

    if (summary.warnings.length > 0) {
      report += `## Warnings\n\n`
      summary.warnings.forEach((warning, index) => {
        report += `${index + 1}. ${warning}\n`
      })
      report += `\n`
    }

    return report
  }

  /**
   * Get quality metrics for the data
   */
  getQualityMetrics(records) {
    const metrics = {
      totalRecords: records.length,
      completenessScore: 0,
      qualityScore: 0,
      fieldCompleteness: {},
      errorRate: 0,
      warningRate: 0
    }

    // Calculate field completeness
    const allFields = this.config.getAllFields()
    allFields.forEach(field => {
      const filledCount = records.filter(record => 
        record[field] !== null && record[field] !== undefined && record[field] !== ''
      ).length
      metrics.fieldCompleteness[field] = (filledCount / records.length) * 100
    })

    // Calculate overall completeness score
    const completenessValues = Object.values(metrics.fieldCompleteness)
    metrics.completenessScore = completenessValues.length > 0 
      ? completenessValues.reduce((sum, val) => sum + val, 0) / completenessValues.length
      : 0

    // Calculate error and warning rates
    metrics.errorRate = (this.validationErrors.length / records.length) * 100
    metrics.warningRate = (this.validationWarnings.length / records.length) * 100

    // Calculate overall quality score
    metrics.qualityScore = Math.max(0, 100 - metrics.errorRate - (metrics.warningRate * 0.5))

    return metrics
  }
}
