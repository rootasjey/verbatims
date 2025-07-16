/**
 * Migration Configuration Management
 * Handles configuration for different migration types including
 * validation rules, transformation settings, and database mappings.
 */

export class MigrationConfig {
  constructor(migrationType) {
    this.migrationType = migrationType
    this.config = this.loadConfig(migrationType)
  }

  /**
   * Load configuration for specific migration type
   */
  loadConfig(migrationType) {
    const configs = {
      references: {
        tableName: 'quote_references',
        primaryKey: 'id',
        requiredFields: ['name', 'primary_type'],
        optionalFields: [
          'original_language', 'release_date', 'description', 'secondary_type',
          'image_url', 'urls', 'imdb_id', 'isbn', 'spotify_id',
          'views_count', 'likes_count', 'shares_count', 'created_at', 'updated_at'
        ],
        validationRules: {
          name: {
            type: 'string',
            minLength: 2,
            maxLength: 200,
            required: true
          },
          primary_type: {
            type: 'enum',
            values: [
              'film', 'book', 'tv_series', 'music', 'speech', 'podcast',
              'interview', 'documentary', 'media_stream', 'writings',
              'video_game', 'other'
            ],
            required: true
          },
          original_language: {
            type: 'string',
            default: 'en',
            pattern: /^[a-z]{2}$/
          },
          release_date: {
            type: 'date',
            nullable: true
          },
          description: {
            type: 'string',
            maxLength: 2000
          },
          secondary_type: {
            type: 'string',
            maxLength: 100
          },
          image_url: {
            type: 'url',
            nullable: true
          },
          urls: {
            type: 'json',
            default: '[]'
          },
          imdb_id: {
            type: 'string',
            pattern: /^tt\d{7,}$/,
            nullable: true
          },
          isbn: {
            type: 'string',
            pattern: /^\d{10}$|^\d{13}$/,
            nullable: true
          },
          spotify_id: {
            type: 'string',
            pattern: /^[a-zA-Z0-9]{22}$/,
            nullable: true
          },
          views_count: {
            type: 'integer',
            min: 0,
            default: 0
          },
          likes_count: {
            type: 'integer',
            min: 0,
            default: 0
          },
          shares_count: {
            type: 'integer',
            min: 0,
            default: 0
          }
        },
        transformationMappings: {
          'name': 'name',
          'language': 'original_language',
          'release.original': 'release_date',
          'summary': 'description',
          'type.primary': 'primary_type',
          'type.secondary': 'secondary_type',
          'urls.image': 'image_url',
          'urls': 'urls',
          'urls.imdb': 'imdb_id',
          'urls.spotify': 'spotify_id',
          'created_at': 'created_at',
          'updated_at': 'updated_at'
        },
        batchSize: 50,
        backupRequired: true
      },

      authors: {
        tableName: 'authors',
        primaryKey: 'id',
        requiredFields: ['name'],
        optionalFields: [
          'bio', 'birth_date', 'death_date', 'nationality', 'image_url',
          'website_url', 'wikipedia_url', 'views_count', 'quotes_count',
          'created_at', 'updated_at'
        ],
        validationRules: {
          name: {
            type: 'string',
            minLength: 2,
            maxLength: 200,
            required: true
          },
          bio: {
            type: 'string',
            maxLength: 5000
          },
          birth_date: {
            type: 'date',
            nullable: true
          },
          death_date: {
            type: 'date',
            nullable: true
          },
          nationality: {
            type: 'string',
            maxLength: 100
          },
          image_url: {
            type: 'url',
            nullable: true
          },
          website_url: {
            type: 'url',
            nullable: true
          },
          wikipedia_url: {
            type: 'url',
            nullable: true
          },
          views_count: {
            type: 'integer',
            min: 0,
            default: 0
          },
          quotes_count: {
            type: 'integer',
            min: 0,
            default: 0
          }
        },
        transformationMappings: {
          'name': 'name',
          'bio': 'bio',
          'birth_date': 'birth_date',
          'death_date': 'death_date',
          'nationality': 'nationality',
          'image_url': 'image_url',
          'website_url': 'website_url',
          'wikipedia_url': 'wikipedia_url',
          'created_at': 'created_at',
          'updated_at': 'updated_at'
        },
        batchSize: 100,
        backupRequired: true
      },

      quotes: {
        tableName: 'quotes',
        primaryKey: 'id',
        requiredFields: ['name', 'user_id'],
        optionalFields: [
          'language', 'author_id', 'reference_id', 'status', 'moderator_id',
          'moderated_at', 'rejection_reason', 'views_count', 'likes_count',
          'shares_count', 'is_featured', 'created_at', 'updated_at'
        ],
        validationRules: {
          name: {
            type: 'string',
            minLength: 10,
            maxLength: 3000,
            required: true
          },
          language: {
            type: 'string',
            default: 'en',
            enum: ['en', 'fr', 'es', 'de', 'it', 'pt', 'ru', 'ja', 'zh']
          },
          author_id: {
            type: 'integer',
            nullable: true,
            foreignKey: 'authors.id'
          },
          reference_id: {
            type: 'integer',
            nullable: true,
            foreignKey: 'quote_references.id'
          },
          user_id: {
            type: 'integer',
            required: true,
            foreignKey: 'users.id'
          },
          status: {
            type: 'string',
            default: 'approved',
            enum: ['draft', 'approved', 'rejected']
          },
          moderator_id: {
            type: 'integer',
            nullable: true,
            foreignKey: 'users.id'
          },
          moderated_at: {
            type: 'datetime',
            nullable: true
          },
          rejection_reason: {
            type: 'string',
            nullable: true
          },
          views_count: {
            type: 'integer',
            min: 0,
            default: 0
          },
          likes_count: {
            type: 'integer',
            min: 0,
            default: 0
          },
          shares_count: {
            type: 'integer',
            min: 0,
            default: 0
          },
          is_featured: {
            type: 'boolean',
            default: false
          },
          created_at: {
            type: 'datetime',
            nullable: true
          },
          updated_at: {
            type: 'datetime',
            nullable: true
          }
        },
        transformationMappings: {
          'name': 'name',
          'language': 'language',
          'author': 'author_id',
          'reference': 'reference_id',
          'user': 'user_id',
          'metrics.likes': 'likes_count',
          'metrics.shares': 'shares_count',
          'created_at': 'created_at',
          'updated_at': 'updated_at'
        },
        batchSize: 25,
        backupRequired: true,
        multipleFiles: true,
        filePattern: 'quotes_part_*.json',
        defaultUserId: 1, // Default user for migration
        defaultStatus: 'approved' // Existing quotes are approved
      }
    }

    if (!configs[migrationType]) {
      throw new Error(`Unknown migration type: ${migrationType}`)
    }

    return configs[migrationType]
  }

  /**
   * Get table name for this migration type
   */
  getTableName() {
    return this.config.tableName
  }

  /**
   * Get primary key field name
   */
  getPrimaryKey() {
    return this.config.primaryKey
  }

  /**
   * Get all field names (required + optional)
   */
  getAllFields() {
    return [...this.config.requiredFields, ...this.config.optionalFields]
  }

  /**
   * Get required field names
   */
  getRequiredFields() {
    return this.config.requiredFields
  }

  /**
   * Get optional field names
   */
  getOptionalFields() {
    return this.config.optionalFields
  }

  /**
   * Get validation rules for a specific field
   */
  getFieldValidation(fieldName) {
    return this.config.validationRules[fieldName] || null
  }

  /**
   * Get all validation rules
   */
  getAllValidationRules() {
    return this.config.validationRules
  }

  /**
   * Get transformation mapping for Firebase field to SQL field
   */
  getFieldMapping(firebaseField) {
    return this.config.transformationMappings[firebaseField] || null
  }

  /**
   * Get all transformation mappings
   */
  getAllMappings() {
    return this.config.transformationMappings
  }

  /**
   * Get batch size for this migration type
   */
  getBatchSize() {
    return this.config.batchSize
  }

  /**
   * Check if backup is required for this migration type
   */
  isBackupRequired() {
    return this.config.backupRequired
  }

  /**
   * Validate field value against its rules
   */
  validateField(fieldName, value) {
    const rules = this.getFieldValidation(fieldName)
    if (!rules) {
      return { isValid: true, errors: [], warnings: [] }
    }

    const errors = []
    const warnings = []

    // Check required
    if (rules.required && (value === null || value === undefined || value === '')) {
      errors.push(`${fieldName} is required`)
      return { isValid: false, errors, warnings }
    }

    // Skip further validation if value is null/undefined and field is nullable
    if ((value === null || value === undefined) && rules.nullable) {
      return { isValid: true, errors, warnings }
    }

    // Type validation
    if (rules.type === 'string' && typeof value !== 'string') {
      errors.push(`${fieldName} must be a string`)
    } else if (rules.type === 'integer' && !Number.isInteger(value)) {
      errors.push(`${fieldName} must be an integer`)
    } else if (rules.type === 'date' && isNaN(Date.parse(value))) {
      errors.push(`${fieldName} must be a valid date`)
    } else if (rules.type === 'url' && !this.isValidUrl(value)) {
      errors.push(`${fieldName} must be a valid URL`)
    } else if (rules.type === 'json' && !this.isValidJson(value)) {
      errors.push(`${fieldName} must be valid JSON`)
    } else if (rules.type === 'enum' && !rules.values.includes(value)) {
      errors.push(`${fieldName} must be one of: ${rules.values.join(', ')}`)
    }

    // Length validation
    if (rules.minLength && value.length < rules.minLength) {
      errors.push(`${fieldName} must be at least ${rules.minLength} characters`)
    }
    if (rules.maxLength && value.length > rules.maxLength) {
      errors.push(`${fieldName} must be no more than ${rules.maxLength} characters`)
    }

    // Numeric range validation
    if (rules.min !== undefined && value < rules.min) {
      errors.push(`${fieldName} must be at least ${rules.min}`)
    }
    if (rules.max !== undefined && value > rules.max) {
      errors.push(`${fieldName} must be no more than ${rules.max}`)
    }

    // Pattern validation
    if (rules.pattern && !rules.pattern.test(value)) {
      errors.push(`${fieldName} format is invalid`)
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Utility validation methods
   */
  isValidUrl(url) {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  isValidJson(str) {
    try {
      JSON.parse(str)
      return true
    } catch {
      return false
    }
  }
}
