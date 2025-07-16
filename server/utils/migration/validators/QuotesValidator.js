/**
 * Quotes Validator
 * Specialized validator for quotes migration with
 * quote-specific validation rules and logic.
 */

import { BaseValidator } from './BaseValidator.js'

export class QuotesValidator extends BaseValidator {
  constructor() {
    super('quotes')
  }

  /**
   * Custom validation for quote records
   */
  validateRecordCustom(record, index) {
    const errors = []
    const warnings = []
    const context = `Quote ${index + 1} (${record.firebase_id || record.name?.substring(0, 50) || 'unknown'}...)`

    // Validate quote content length and quality
    if (record.name) {
      const content = record.name.trim()
      
      // Check minimum length
      if (content.length < 10) {
        errors.push(`${context}: Quote content too short (${content.length} chars, minimum 10)`)
      }
      
      // Check maximum length
      if (content.length > 3000) {
        errors.push(`${context}: Quote content too long (${content.length} chars, maximum 3000)`)
      }
      
      // Check for suspicious patterns
      if (content.includes('http://') || content.includes('https://')) {
        warnings.push(`${context}: Quote contains URLs`)
      }
      
      // Check for excessive repetition
      const words = content.toLowerCase().split(/\s+/)
      const wordCounts = {}
      words.forEach(word => {
        if (word.length > 3) {
          wordCounts[word] = (wordCounts[word] || 0) + 1
        }
      })
      
      const maxRepeats = Math.max(...Object.values(wordCounts))
      if (maxRepeats > 5) {
        warnings.push(`${context}: Excessive word repetition detected`)
      }
    }

    // Validate language
    if (record.language) {
      const validLanguages = ['en', 'fr', 'es', 'de', 'it', 'pt', 'ru', 'ja', 'zh']
      if (!validLanguages.includes(record.language)) {
        warnings.push(`${context}: Unsupported language "${record.language}"`)
      }
    }

    // Validate author relationship (handle both Firebase and transformed data)
    if (record.author_id !== undefined) {
      // Transformed data - author_id can be null (no author) or a number
      if (record.author_id !== null && typeof record.author_id !== 'number') {
        errors.push(`${context}: Invalid author_id type`)
      }
    } else if (record.author) {
      // Original Firebase data - validate author object
      if (!record.author.id && !record.author.name) {
        warnings.push(`${context}: Author has no ID or name`)
      }

      if (record.author.name === 'Anonymous' && record.author.id) {
        // This is fine, anonymous quotes can have an author ID
      }
    }

    // Validate reference relationship (handle both Firebase and transformed data)
    if (record.reference_id !== undefined) {
      // Transformed data - reference_id can be null (no reference) or a number
      if (record.reference_id !== null && typeof record.reference_id !== 'number') {
        errors.push(`${context}: Invalid reference_id type`)
      }
    } else if (record.reference) {
      // Original Firebase data - validate reference object
      if (!record.reference.id && !record.reference.name) {
        // Empty reference is acceptable
      } else if (record.reference.id && !record.reference.name) {
        warnings.push(`${context}: Reference has ID but no name`)
      } else if (!record.reference.id && record.reference.name) {
        warnings.push(`${context}: Reference has name but no ID`)
      }
    }

    // Validate topics structure
    if (record.topics) {
      if (typeof record.topics !== 'object') {
        errors.push(`${context}: Topics must be an object`)
      } else {
        const topicKeys = Object.keys(record.topics)
        if (topicKeys.length === 0) {
          warnings.push(`${context}: No topics assigned`)
        }
        
        // Check for valid topic values
        topicKeys.forEach(topic => {
          if (record.topics[topic] !== true) {
            warnings.push(`${context}: Topic "${topic}" has non-boolean value`)
          }
        })
        
        // Check for common topic names
        const validTopics = [
          'art', 'biology', 'feelings', 'fun', 'gratitude', 'introspection',
          'knowledge', 'language', 'mature', 'metaphor', 'motivation',
          'offensive', 'philosophy', 'poetry', 'proverb', 'psychology',
          'punchline', 'retrospection', 'sciences', 'social', 'spiritual',
          'travel', 'work'
        ]
        
        topicKeys.forEach(topic => {
          if (!validTopics.includes(topic)) {
            warnings.push(`${context}: Uncommon topic "${topic}"`)
          }
        })
      }
    }

    // Validate metrics
    if (record.metrics) {
      if (typeof record.metrics !== 'object') {
        errors.push(`${context}: Metrics must be an object`)
      } else {
        // Validate likes count
        if (record.metrics.likes !== undefined) {
          if (typeof record.metrics.likes !== 'number' || record.metrics.likes < 0) {
            errors.push(`${context}: Invalid likes count`)
          }
        }
        
        // Validate shares count
        if (record.metrics.shares !== undefined) {
          if (typeof record.metrics.shares !== 'number' || record.metrics.shares < 0) {
            errors.push(`${context}: Invalid shares count`)
          }
        }
      }
    }

    // Validate user relationship (check transformed data structure)
    if (record.user_id !== undefined) {
      // Transformed data - check user_id
      if (!record.user_id || typeof record.user_id !== 'number') {
        errors.push(`${context}: Invalid user_id`)
      }
    } else if (record.user) {
      // Original Firebase data - check user object
      if (!record.user.id) {
        errors.push(`${context}: User must have an ID`)
      }
    } else {
      errors.push(`${context}: Quote must have a user or user_id`)
    }

    // Validate timestamps
    if (record.created_at) {
      if (!this.isValidFirebaseTimestamp(record.created_at)) {
        warnings.push(`${context}: Invalid created_at timestamp format`)
      }
    }

    if (record.updated_at) {
      if (!this.isValidFirebaseTimestamp(record.updated_at)) {
        warnings.push(`${context}: Invalid updated_at timestamp format`)
      }
    }

    // Check timestamp consistency
    if (record.created_at && record.updated_at) {
      const createdTime = this.parseFirebaseTimestamp(record.created_at)
      const updatedTime = this.parseFirebaseTimestamp(record.updated_at)
      
      if (createdTime && updatedTime && createdTime > updatedTime) {
        warnings.push(`${context}: Created date is after updated date`)
      }
    }

    return { errors, warnings }
  }

  /**
   * Validate Firebase timestamp format
   */
  isValidFirebaseTimestamp(timestamp) {
    if (!timestamp || typeof timestamp !== 'object') {
      return false
    }
    
    return timestamp.__time__ && typeof timestamp.__time__ === 'string'
  }

  /**
   * Parse Firebase timestamp to Date object
   */
  parseFirebaseTimestamp(timestamp) {
    if (!this.isValidFirebaseTimestamp(timestamp)) {
      return null
    }
    
    try {
      return new Date(timestamp.__time__)
    } catch (error) {
      return null
    }
  }

  /**
   * Generate validation summary with quote-specific metrics
   */
  generateValidationSummary() {
    const summary = super.generateValidationSummary()
    
    // Add quote-specific metrics
    summary.quoteSpecific = {
      languageDistribution: this.getLanguageDistribution(),
      topicDistribution: this.getTopicDistribution(),
      averageQuoteLength: this.getAverageQuoteLength(),
      authorDistribution: this.getAuthorDistribution()
    }
    
    return summary
  }

  /**
   * Get language distribution from validated records
   */
  getLanguageDistribution() {
    // This would be implemented to analyze language distribution
    // For now, return placeholder
    return {
      en: 0,
      fr: 0,
      other: 0
    }
  }

  /**
   * Get topic distribution from validated records
   */
  getTopicDistribution() {
    // This would be implemented to analyze topic distribution
    // For now, return placeholder
    return {}
  }

  /**
   * Get average quote length
   */
  getAverageQuoteLength() {
    // This would be implemented to calculate average length
    // For now, return placeholder
    return 0
  }

  /**
   * Get author distribution
   */
  getAuthorDistribution() {
    // This would be implemented to analyze author distribution
    // For now, return placeholder
    return {}
  }
}
