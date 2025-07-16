/**
 * Authors Validator
 * Specialized validator for authors migration with
 * author-specific validation rules and logic.
 */

import { BaseValidator } from './BaseValidator.js'

export class AuthorsValidator extends BaseValidator {
  constructor() {
    super('authors')
  }

  /**
   * Custom validation for author records
   */
  validateRecordCustom(record, index) {
    const errors = []
    const warnings = []
    const context = `Author ${index + 1} (${record.firebase_id || record.name || 'unknown'})`

    // Validate birth/death date consistency
    if (record.birth_date && record.death_date) {
      const birthDate = new Date(record.birth_date)
      const deathDate = new Date(record.death_date)
      
      if (birthDate >= deathDate) {
        errors.push(`${context}: Birth date must be before death date`)
      }
      
      // Check for unrealistic lifespans
      const lifespan = deathDate.getFullYear() - birthDate.getFullYear()
      if (lifespan > 150) {
        warnings.push(`${context}: Unusually long lifespan (${lifespan} years)`)
      }
    }

    // Validate birth date is not in the future
    if (record.birth_date) {
      const birthDate = new Date(record.birth_date)
      const now = new Date()
      if (birthDate > now) {
        warnings.push(`${context}: Birth date is in the future: ${record.birth_date}`)
      }
    }

    // Validate death date is not in the future (unless it's a very recent date)
    if (record.death_date) {
      const deathDate = new Date(record.death_date)
      const now = new Date()
      const daysDiff = (now - deathDate) / (1000 * 60 * 60 * 24)
      
      if (deathDate > now && daysDiff < -1) {
        warnings.push(`${context}: Death date is in the future: ${record.death_date}`)
      }
    }

    // Validate image URL format
    if (record.image_url && !this.isValidImageUrl(record.image_url)) {
      warnings.push(`${context}: Invalid image URL format "${record.image_url}"`)
    }

    // Validate website URL
    if (record.website_url && !this.isValidUrl(record.website_url)) {
      warnings.push(`${context}: Invalid website URL "${record.website_url}"`)
    }

    // Validate Wikipedia URL
    if (record.wikipedia_url && !this.isValidWikipediaUrl(record.wikipedia_url)) {
      warnings.push(`${context}: Invalid Wikipedia URL "${record.wikipedia_url}"`)
    }

    // Check for fictional vs real person consistency
    if (record.is_fictional !== undefined) {
      if (record.is_fictional && record.birth_date) {
        warnings.push(`${context}: Fictional character has birth date`)
      }
      if (record.is_fictional && record.death_date) {
        warnings.push(`${context}: Fictional character has death date`)
      }
      if (record.is_fictional && record.nationality) {
        // This might be OK for fictional characters from specific countries
        // warnings.push(`${context}: Fictional character has nationality`)
      }
    }

    // Validate bio length is reasonable
    if (record.bio && record.bio.length < 10) {
      warnings.push(`${context}: Very short bio (${record.bio.length} characters)`)
    }

    // Check for missing essential information
    if (!record.bio || record.bio.trim() === '') {
      warnings.push(`${context}: Missing biography`)
    }

    // Validate job/profession field
    if (record.job && record.job.length > 200) {
      warnings.push(`${context}: Job description is very long (${record.job.length} characters)`)
    }

    return { errors, warnings }
  }

  /**
   * Get fields to check for duplicates
   */
  getDuplicateCheckFields() {
    return ['name', 'wikipedia_url', 'website_url']
  }

  /**
   * Get fields to analyze for distribution
   */
  getDistributionAnalysisFields() {
    return ['nationality', 'job', 'is_fictional']
  }

  /**
   * Custom consistency validation for authors
   */
  validateConsistencyCustom(records) {
    // Check fictional vs real author distribution
    const fictionalCount = records.filter(record => record.is_fictional === true).length
    const realCount = records.filter(record => record.is_fictional === false).length
    
    if (fictionalCount > realCount) {
      this.validationWarnings.push(
        `More fictional characters than real people: ${fictionalCount} fictional vs ${realCount} real`
      )
    }

    // Check for missing birth dates in historical figures
    const historicalFigures = records.filter(record => 
      !record.is_fictional && 
      record.death_date && 
      new Date(record.death_date) < new Date('1950-01-01')
    )
    
    const missingBirthDates = historicalFigures.filter(record => !record.birth_date).length
    if (missingBirthDates > historicalFigures.length * 0.3) {
      this.validationWarnings.push(
        `High number of historical figures missing birth dates: ${missingBirthDates}/${historicalFigures.length}`
      )
    }

    // Check for missing biographies
    const missingBios = records.filter(record => !record.bio || record.bio.trim() === '').length
    if (missingBios > records.length * 0.2) {
      this.validationWarnings.push(
        `High number of authors missing biographies: ${missingBios} (${((missingBios / records.length) * 100).toFixed(1)}%)`
      )
    }

    // Check for missing images
    const missingImages = records.filter(record => !record.image_url || record.image_url.trim() === '').length
    if (missingImages > records.length * 0.4) {
      this.validationWarnings.push(
        `High number of authors missing images: ${missingImages} (${((missingImages / records.length) * 100).toFixed(1)}%)`
      )
    }

    // Check nationality distribution
    const nationalityDistribution = {}
    records.forEach(record => {
      if (record.nationality) {
        nationalityDistribution[record.nationality] = 
          (nationalityDistribution[record.nationality] || 0) + 1
      }
    })

    // Warn if one nationality dominates too much
    Object.entries(nationalityDistribution).forEach(([nationality, count]) => {
      const percentage = (count / records.length) * 100
      if (percentage > 60) {
        this.validationWarnings.push(
          `High concentration of ${nationality} authors: ${count} (${percentage.toFixed(1)}%)`
        )
      }
    })
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
   * Validate Wikipedia URL format
   */
  isValidWikipediaUrl(url) {
    if (!url) return false
    
    // Check if it's a valid URL first
    if (!this.isValidUrl(url)) return false
    
    // Check if it's a Wikipedia URL
    return /^https?:\/\/[a-z]{2,3}\.wikipedia\.org\/wiki\/.+/i.test(url)
  }

  /**
   * Generate author-specific quality metrics
   */
  getQualityMetrics(records) {
    const baseMetrics = super.getQualityMetrics(records)
    
    // Add author-specific metrics
    const authorMetrics = {
      ...baseMetrics,
      fictionalCount: 0,
      realCount: 0,
      hasBirthDate: 0,
      hasDeathDate: 0,
      hasNationality: 0,
      hasJob: 0,
      hasBio: 0,
      hasImage: 0,
      hasWebsite: 0,
      hasWikipedia: 0,
      averageBioLength: 0,
      averageNameLength: 0,
      nationalityDistribution: {},
      jobDistribution: {},
      centuryDistribution: {}
    }

    let totalBioLength = 0
    let totalNameLength = 0
    let biosCount = 0

    records.forEach(record => {
      // Fictional vs real
      if (record.is_fictional === true) {
        authorMetrics.fictionalCount++
      } else if (record.is_fictional === false) {
        authorMetrics.realCount++
      }

      // Field presence
      if (record.birth_date) authorMetrics.hasBirthDate++
      if (record.death_date) authorMetrics.hasDeathDate++
      if (record.nationality) authorMetrics.hasNationality++
      if (record.job) authorMetrics.hasJob++
      if (record.image_url) authorMetrics.hasImage++
      if (record.website_url) authorMetrics.hasWebsite++
      if (record.wikipedia_url) authorMetrics.hasWikipedia++
      
      // Bio metrics
      if (record.bio && record.bio.trim()) {
        authorMetrics.hasBio++
        totalBioLength += record.bio.length
        biosCount++
      }

      // Name length
      if (record.name) {
        totalNameLength += record.name.length
      }

      // Nationality distribution
      if (record.nationality) {
        authorMetrics.nationalityDistribution[record.nationality] = 
          (authorMetrics.nationalityDistribution[record.nationality] || 0) + 1
      }

      // Job distribution
      if (record.job) {
        authorMetrics.jobDistribution[record.job] = 
          (authorMetrics.jobDistribution[record.job] || 0) + 1
      }

      // Century distribution (based on birth date)
      if (record.birth_date) {
        const birthYear = new Date(record.birth_date).getFullYear()
        const century = Math.floor(birthYear / 100) + 1
        const centuryKey = `${century}th century`
        authorMetrics.centuryDistribution[centuryKey] = 
          (authorMetrics.centuryDistribution[centuryKey] || 0) + 1
      }
    })

    // Calculate averages
    authorMetrics.averageBioLength = biosCount > 0 
      ? Math.round(totalBioLength / biosCount) 
      : 0
    authorMetrics.averageNameLength = records.length > 0 
      ? Math.round(totalNameLength / records.length) 
      : 0

    // Convert counts to percentages
    const total = records.length
    authorMetrics.fictionalPercent = (authorMetrics.fictionalCount / total) * 100
    authorMetrics.realPercent = (authorMetrics.realCount / total) * 100
    authorMetrics.hasBirthDatePercent = (authorMetrics.hasBirthDate / total) * 100
    authorMetrics.hasDeathDatePercent = (authorMetrics.hasDeathDate / total) * 100
    authorMetrics.hasNationalityPercent = (authorMetrics.hasNationality / total) * 100
    authorMetrics.hasJobPercent = (authorMetrics.hasJob / total) * 100
    authorMetrics.hasBioPercent = (authorMetrics.hasBio / total) * 100
    authorMetrics.hasImagePercent = (authorMetrics.hasImage / total) * 100
    authorMetrics.hasWebsitePercent = (authorMetrics.hasWebsite / total) * 100
    authorMetrics.hasWikipediaPercent = (authorMetrics.hasWikipedia / total) * 100

    return authorMetrics
  }
}
