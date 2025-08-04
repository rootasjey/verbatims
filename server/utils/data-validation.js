/**
 * Data Validation Utilities for Reference Import
 * Provides comprehensive validation for reference data before database import
 */

// Valid enum values from schema
const VALID_PRIMARY_TYPES = ['film', 'book', 'tv_series', 'music', 'speech', 'podcast', 'interview', 'documentary', 'other']
const VALID_LANGUAGES = ['en', 'fr', 'es', 'de', 'it', 'pt', 'ru', 'ja', 'zh']

export class DataValidator {
  constructor() {
    this.validationErrors = []
    this.validationWarnings = []
  }

  /**
   * Validate a single reference object
   */
  validateReference(reference, index = 0) {
    const errors = []
    const warnings = []
    const context = `Reference ${index + 1}${reference.firebase_id ? ` (${reference.firebase_id})` : ''}`

    // Required field validations
    if (!reference.name || typeof reference.name !== 'string') {
      errors.push(`${context}: Missing or invalid name`)
    } else {
      // Name length validation
      if (reference.name.length < 2) {
        errors.push(`${context}: Name too short (minimum 2 characters)`)
      }
      if (reference.name.length > 200) {
        errors.push(`${context}: Name too long (maximum 200 characters)`)
      }
      // Name content validation
      if (reference.name.trim() !== reference.name) {
        warnings.push(`${context}: Name has leading/trailing whitespace`)
      }
    }

    // Primary type validation
    if (!reference.primary_type) {
      errors.push(`${context}: Missing primary_type`)
    } else if (!VALID_PRIMARY_TYPES.includes(reference.primary_type)) {
      errors.push(`${context}: Invalid primary_type "${reference.primary_type}". Must be one of: ${VALID_PRIMARY_TYPES.join(', ')}`)
    }

    // Language validation
    if (reference.original_language && !VALID_LANGUAGES.includes(reference.original_language)) {
      warnings.push(`${context}: Unknown language "${reference.original_language}". Valid languages: ${VALID_LANGUAGES.join(', ')}`)
    }

    // Date validations
    if (reference.release_date) {
      if (!this.isValidDate(reference.release_date)) {
        errors.push(`${context}: Invalid release_date format "${reference.release_date}"`)
      } else {
        const releaseDate = new Date(reference.release_date)
        const currentDate = new Date()
        if (releaseDate > currentDate) {
          warnings.push(`${context}: Release date is in the future`)
        }
        if (releaseDate.getFullYear() < 1000) {
          warnings.push(`${context}: Release date seems very old (${releaseDate.getFullYear()})`)
        }
      }
    }

    if (reference.created_at && !this.isValidDate(reference.created_at)) {
      errors.push(`${context}: Invalid created_at format "${reference.created_at}"`)
    }

    if (reference.updated_at && !this.isValidDate(reference.updated_at)) {
      errors.push(`${context}: Invalid updated_at format "${reference.updated_at}"`)
    }

    // URL validations
    if (reference.image_url && !this.isValidUrl(reference.image_url)) {
      warnings.push(`${context}: Invalid image_url format`)
    }

    // URLs JSON validation
    if (reference.urls) {
      try {
        const urlsObj = typeof reference.urls === 'string' ? JSON.parse(reference.urls) : reference.urls
        if (typeof urlsObj !== 'object' || Array.isArray(urlsObj)) {
          errors.push(`${context}: URLs must be a JSON object`)
        } else {
          // Validate individual URLs
          Object.entries(urlsObj).forEach(([key, url]) => {
            if (url && typeof url === 'string' && url.trim() !== '' && !this.isValidUrl(url)) {
              warnings.push(`${context}: Invalid URL for ${key}: "${url}"`)
            }
          })
        }
      } catch (error) {
        errors.push(`${context}: Invalid JSON in urls field`)
      }
    }

    // Numeric field validations
    const numericFields = ['views_count', 'likes_count', 'shares_count']
    numericFields.forEach(field => {
      if (reference[field] !== undefined && reference[field] !== null) {
        if (!Number.isInteger(reference[field]) || reference[field] < 0) {
          errors.push(`${context}: ${field} must be a non-negative integer`)
        }
      }
    })

    // Content quality validations
    if (reference.description && reference.description.length > 5000) {
      warnings.push(`${context}: Description is very long (${reference.description.length} characters)`)
    }

    if (reference.secondary_type && reference.secondary_type.length > 100) {
      warnings.push(`${context}: Secondary type is very long (${reference.secondary_type.length} characters)`)
    }

    return { errors, warnings }
  }

  /**
   * Validate an array of references
   */
  validateReferences(references) {
    this.validationErrors = []
    this.validationWarnings = []

    if (!Array.isArray(references)) {
      this.validationErrors.push('References must be an array')
      return this.getValidationSummary()
    }

    if (references.length === 0) {
      this.validationWarnings.push('No references to validate')
      return this.getValidationSummary()
    }

    // Validate each reference
    references.forEach((reference, index) => {
      const { errors, warnings } = this.validateReference(reference, index)
      this.validationErrors.push(...errors)
      this.validationWarnings.push(...warnings)
    })

    // Cross-reference validations
    this.validateDuplicates(references)
    this.validateDataConsistency(references)

    return this.getValidationSummary()
  }

  /**
   * Check for duplicate references
   */
  validateDuplicates(references) {
    const nameMap = new Map()
    const urlMap = new Map()

    references.forEach((reference, index) => {
      // Check for duplicate names
      const normalizedName = reference.name?.toLowerCase().trim()
      if (normalizedName) {
        if (nameMap.has(normalizedName)) {
          this.validationWarnings.push(
            `Potential duplicate: "${reference.name}" (indices ${nameMap.get(normalizedName)} and ${index})`
          )
        } else {
          nameMap.set(normalizedName, index)
        }
      }

      // Check for duplicate image URLs
      if (reference.image_url) {
        if (urlMap.has(reference.image_url)) {
          this.validationWarnings.push(
            `Duplicate image URL at indices ${urlMap.get(reference.image_url)} and ${index}`
          )
        } else {
          urlMap.set(reference.image_url, index)
        }
      }
    })
  }

  /**
   * Validate data consistency across references
   */
  validateDataConsistency(references) {
    // Check for unusual patterns
    const typeDistribution = {}
    const languageDistribution = {}

    references.forEach(reference => {
      // Track type distribution
      if (reference.primary_type) {
        typeDistribution[reference.primary_type] = (typeDistribution[reference.primary_type] || 0) + 1
      }

      // Track language distribution
      if (reference.original_language) {
        languageDistribution[reference.original_language] = (languageDistribution[reference.original_language] || 0) + 1
      }
    })

    // Warn about unusual distributions
    const totalReferences = references.length
    Object.entries(typeDistribution).forEach(([type, count]) => {
      const percentage = (count / totalReferences) * 100
      if (percentage > 50) {
        this.validationWarnings.push(
          `High concentration of ${type} references (${percentage.toFixed(1)}%)`
        )
      }
    })
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
   * Validate a single quote object
   */
  validateQuote(quote, index = 0) {
    const errors = []
    const warnings = []
    const context = `Quote ${index + 1}${quote.firebase_id ? ` (${quote.firebase_id})` : ''}`

    // Required field validations
    if (!quote.name || typeof quote.name !== 'string') {
      errors.push(`${context}: Missing or invalid quote text`)
    } else {
      // Quote text length validation
      if (quote.name.length < 3) {
        errors.push(`${context}: Quote text too short (minimum 10 characters)`)
      }
      if (quote.name.length > 6000) {
        errors.push(`${context}: Quote text too long (maximum 3000 characters)`)
      }
      // Quote content validation
      if (quote.name.trim() !== quote.name) {
        warnings.push(`${context}: Quote text has leading/trailing whitespace`)
      }
    }

    // Language validation
    const validLanguages = ['en', 'fr', 'es', 'de', 'it', 'pt', 'ru', 'ja', 'zh']
    if (quote.language && !validLanguages.includes(quote.language)) {
      warnings.push(`${context}: Unsupported language "${quote.language}", defaulting to "en"`)
    }

    // Status validation
    const validStatuses = ['draft', 'pending', 'approved', 'rejected']
    if (quote.status && !validStatuses.includes(quote.status)) {
      errors.push(`${context}: Invalid status "${quote.status}"`)
    }

    // User ID validation
    if (!quote.user_id || typeof quote.user_id !== 'number') {
      errors.push(`${context}: Missing or invalid user_id`)
    }

    // Author validation (if present)
    if (quote.author && typeof quote.author === 'object') {
      if (!quote.author.name || typeof quote.author.name !== 'string') {
        warnings.push(`${context}: Author object present but missing name`)
      }
    }

    // Reference validation (if present)
    if (quote.reference && typeof quote.reference === 'object') {
      if (!quote.reference.name || typeof quote.reference.name !== 'string') {
        warnings.push(`${context}: Reference object present but missing name`)
      }
    }

    // Date validations
    if (quote.created_at && !this.isValidDate(quote.created_at)) {
      warnings.push(`${context}: Invalid created_at date format`)
    }

    if (quote.updated_at && !this.isValidDate(quote.updated_at)) {
      warnings.push(`${context}: Invalid updated_at date format`)
    }

    return { errors, warnings }
  }

  /**
   * Validate an array of quotes
   */
  validateQuotes(quotes) {
    this.validationErrors = []
    this.validationWarnings = []

    if (!Array.isArray(quotes)) {
      this.validationErrors.push('Quotes must be an array')
      return this.getValidationSummary()
    }

    if (quotes.length === 0) {
      this.validationWarnings.push('No quotes to validate')
      return this.getValidationSummary()
    }

    // Validate each quote
    quotes.forEach((quote, index) => {
      const { errors, warnings } = this.validateQuote(quote, index)
      this.validationErrors.push(...errors)
      this.validationWarnings.push(...warnings)
    })

    // Cross-quote validations
    this.validateQuoteDuplicates(quotes)

    return this.getValidationSummary()
  }

  /**
   * Check for duplicate quotes
   */
  validateQuoteDuplicates(quotes) {
    const seenQuotes = new Set()
    const duplicates = []

    quotes.forEach((quote, index) => {
      if (quote.name) {
        const normalizedText = quote.name.toLowerCase().trim()
        if (seenQuotes.has(normalizedText)) {
          duplicates.push(`Quote ${index + 1}: Duplicate quote text`)
        } else {
          seenQuotes.add(normalizedText)
        }
      }
    })

    if (duplicates.length > 0) {
      this.validationWarnings.push(...duplicates)
    }
  }

  /**
   * Generate validation report
   */
  generateReport() {
    const summary = this.getValidationSummary()
    
    let report = `# Data Validation Report\n\n`
    report += `**Generated:** ${new Date().toISOString()}\n\n`
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
}

/**
 * Quick validation function for API use
 */
export function validateReferenceData(data) {
  const validator = new DataValidator()
  return validator.validateReferences(data)
}

/**
 * Validate quote data for import
 */
export function validateQuoteData(data) {
  const validator = new DataValidator()
  return validator.validateQuotes(data)
}
