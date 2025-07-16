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

    // ID validations
    if (reference.imdb_id && !this.isValidImdbId(reference.imdb_id)) {
      warnings.push(`${context}: Invalid IMDb ID format "${reference.imdb_id}"`)
    }

    if (reference.isbn && !this.isValidIsbn(reference.isbn)) {
      warnings.push(`${context}: Invalid ISBN format "${reference.isbn}"`)
    }

    if (reference.spotify_id && !this.isValidSpotifyId(reference.spotify_id)) {
      warnings.push(`${context}: Invalid Spotify ID format "${reference.spotify_id}"`)
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

    // Business logic validations
    if (reference.primary_type === 'book' && !reference.isbn && !reference.description?.toLowerCase().includes('book')) {
      warnings.push(`${context}: Book reference without ISBN or book-related description`)
    }

    if (reference.primary_type === 'film' && !reference.imdb_id && !reference.description?.toLowerCase().includes('film')) {
      warnings.push(`${context}: Film reference without IMDb ID or film-related description`)
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

  isValidImdbId(imdbId) {
    return /^tt\d{7,}$/.test(imdbId)
  }

  isValidIsbn(isbn) {
    // Basic ISBN validation (ISBN-10 or ISBN-13)
    const cleaned = isbn.replace(/[-\s]/g, '')
    return /^\d{10}$/.test(cleaned) || /^\d{13}$/.test(cleaned)
  }

  isValidSpotifyId(spotifyId) {
    // Spotify IDs are typically 22 characters, base62 encoded
    return /^[a-zA-Z0-9]{22}$/.test(spotifyId)
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
