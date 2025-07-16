/**
 * References Validator
 * Specialized validator for quote references migration with
 * references-specific validation rules and logic.
 */

import { BaseValidator } from './BaseValidator.js'

export class ReferencesValidator extends BaseValidator {
  constructor() {
    super('references')
  }

  /**
   * Custom validation for references records
   */
  validateRecordCustom(record, index) {
    const errors = []
    const warnings = []
    const context = `Reference ${index + 1} (${record.firebase_id || 'unknown'})`

    // Validate image URL format (common issue in Firebase data)
    if (record.image_url && !this.isValidImageUrl(record.image_url)) {
      warnings.push(`${context}: Invalid image URL format "${record.image_url}"`)
    }

    // Validate IMDB ID format
    if (record.imdb_id && !this.isValidImdbId(record.imdb_id)) {
      warnings.push(`${context}: Invalid IMDB ID format "${record.imdb_id}"`)
    }

    // Validate Spotify ID format
    if (record.spotify_id && !this.isValidSpotifyId(record.spotify_id)) {
      warnings.push(`${context}: Invalid Spotify ID format "${record.spotify_id}"`)
    }

    // Validate ISBN format
    if (record.isbn && !this.isValidIsbn(record.isbn)) {
      warnings.push(`${context}: Invalid ISBN format "${record.isbn}"`)
    }

    // Validate URLs JSON structure
    if (record.urls) {
      try {
        const urls = JSON.parse(record.urls)
        if (!Array.isArray(urls) && typeof urls !== 'object') {
          warnings.push(`${context}: URLs should be an array or object`)
        }
      } catch {
        errors.push(`${context}: Invalid JSON in urls field`)
      }
    }

    // Validate release date is not in the future
    if (record.release_date) {
      const releaseDate = new Date(record.release_date)
      const now = new Date()
      if (releaseDate > now) {
        warnings.push(`${context}: Release date is in the future: ${record.release_date}`)
      }
    }

    // Validate primary type specific fields
    this.validateTypeSpecificFields(record, context, errors, warnings)

    return { errors, warnings }
  }

  /**
   * Validate fields specific to certain primary types
   */
  validateTypeSpecificFields(record, context, errors, warnings) {
    const primaryType = record.primary_type

    switch (primaryType) {
      case 'film':
      case 'tv_series':
      case 'documentary':
        if (!record.imdb_id && !record.release_date) {
          warnings.push(`${context}: ${primaryType} should have IMDB ID or release date`)
        }
        break

      case 'book':
        if (!record.isbn && !record.release_date) {
          warnings.push(`${context}: Book should have ISBN or release date`)
        }
        break

      case 'music':
      case 'podcast':
        if (!record.spotify_id && !record.release_date) {
          warnings.push(`${context}: ${primaryType} should have Spotify ID or release date`)
        }
        break

      case 'speech':
      case 'interview':
        if (!record.release_date) {
          warnings.push(`${context}: ${primaryType} should have a date`)
        }
        break
    }

    return { errors, warnings }
  }

  /**
   * Get fields to check for duplicates
   */
  getDuplicateCheckFields() {
    return ['name', 'imdb_id', 'isbn', 'spotify_id']
  }

  /**
   * Get fields to analyze for distribution
   */
  getDistributionAnalysisFields() {
    return ['primary_type', 'original_language', 'secondary_type']
  }

  /**
   * Custom consistency validation for references
   */
  validateConsistencyCustom(records) {
    // Check for unusual language distributions
    const languageDistribution = {}
    records.forEach(record => {
      if (record.original_language) {
        languageDistribution[record.original_language] = 
          (languageDistribution[record.original_language] || 0) + 1
      }
    })

    // Warn if too many records have unknown language
    const unknownLanguageCount = languageDistribution['unknown'] || 0
    if (unknownLanguageCount > records.length * 0.1) {
      this.validationWarnings.push(
        `High number of records with unknown language: ${unknownLanguageCount} (${((unknownLanguageCount / records.length) * 100).toFixed(1)}%)`
      )
    }

    // Check for missing descriptions
    const missingDescriptions = records.filter(record => !record.description || record.description.trim() === '').length
    if (missingDescriptions > records.length * 0.3) {
      this.validationWarnings.push(
        `High number of records missing descriptions: ${missingDescriptions} (${((missingDescriptions / records.length) * 100).toFixed(1)}%)`
      )
    }

    // Check for missing images
    const missingImages = records.filter(record => !record.image_url || record.image_url.trim() === '').length
    if (missingImages > records.length * 0.5) {
      this.validationWarnings.push(
        `High number of records missing images: ${missingImages} (${((missingImages / records.length) * 100).toFixed(1)}%)`
      )
    }
  }

  /**
   * Validate image URL format
   */
  isValidImageUrl(imageUrl) {
    if (!imageUrl) return false
    
    // Check if it's a valid URL
    if (!this.isValidUrl(imageUrl)) {
      // Check if it's just a filename (common in Firebase data)
      return /\.(jpg|jpeg|png|gif|webp)$/i.test(imageUrl)
    }
    
    return true
  }

  /**
   * Validate IMDB ID format
   */
  isValidImdbId(imdbId) {
    return /^tt\d{7,}$/.test(imdbId)
  }

  /**
   * Validate ISBN format
   */
  isValidIsbn(isbn) {
    // Basic ISBN validation (ISBN-10 or ISBN-13)
    const cleaned = isbn.replace(/[-\s]/g, '')
    return /^\d{10}$/.test(cleaned) || /^\d{13}$/.test(cleaned)
  }

  /**
   * Validate Spotify ID format
   */
  isValidSpotifyId(spotifyId) {
    // Spotify IDs are typically 22 characters, base62 encoded
    return /^[a-zA-Z0-9]{22}$/.test(spotifyId)
  }

  /**
   * Generate references-specific quality metrics
   */
  getQualityMetrics(records) {
    const baseMetrics = super.getQualityMetrics(records)
    
    // Add references-specific metrics
    const referencesMetrics = {
      ...baseMetrics,
      mediaTypeDistribution: {},
      hasImdbId: 0,
      hasIsbn: 0,
      hasSpotifyId: 0,
      hasImage: 0,
      hasDescription: 0,
      averageDescriptionLength: 0,
      averageNameLength: 0
    }

    let totalDescriptionLength = 0
    let totalNameLength = 0
    let descriptionsCount = 0

    records.forEach(record => {
      // Media type distribution
      if (record.primary_type) {
        referencesMetrics.mediaTypeDistribution[record.primary_type] = 
          (referencesMetrics.mediaTypeDistribution[record.primary_type] || 0) + 1
      }

      // ID presence
      if (record.imdb_id) referencesMetrics.hasImdbId++
      if (record.isbn) referencesMetrics.hasIsbn++
      if (record.spotify_id) referencesMetrics.hasSpotifyId++
      if (record.image_url) referencesMetrics.hasImage++
      
      // Description metrics
      if (record.description && record.description.trim()) {
        referencesMetrics.hasDescription++
        totalDescriptionLength += record.description.length
        descriptionsCount++
      }

      // Name length
      if (record.name) {
        totalNameLength += record.name.length
      }
    })

    // Calculate averages
    referencesMetrics.averageDescriptionLength = descriptionsCount > 0 
      ? Math.round(totalDescriptionLength / descriptionsCount) 
      : 0
    referencesMetrics.averageNameLength = records.length > 0 
      ? Math.round(totalNameLength / records.length) 
      : 0

    // Convert counts to percentages
    const total = records.length
    referencesMetrics.hasImdbIdPercent = (referencesMetrics.hasImdbId / total) * 100
    referencesMetrics.hasIsbnPercent = (referencesMetrics.hasIsbn / total) * 100
    referencesMetrics.hasSpotifyIdPercent = (referencesMetrics.hasSpotifyId / total) * 100
    referencesMetrics.hasImagePercent = (referencesMetrics.hasImage / total) * 100
    referencesMetrics.hasDescriptionPercent = (referencesMetrics.hasDescription / total) * 100

    return referencesMetrics
  }
}
