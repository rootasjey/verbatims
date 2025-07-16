/**
 * Migration Registry
 * Manages registration, discovery, and instantiation of migration types.
 * Provides a centralized way to manage all available migrations.
 */

export class MigrationRegistry {
  constructor() {
    this.migrations = new Map()
    this.initialized = false
  }

  /**
   * Initialize the registry with available migrations
   */
  async initialize() {
    if (this.initialized) {
      return
    }

    try {
      // Import available migration types
      const { ReferencesMigration } = await import('../types/ReferencesMigration.js')
      const { AuthorsMigration } = await import('../types/AuthorsMigration.js')
      
      // Register migrations
      this.register('references', ReferencesMigration)
      this.register('authors', AuthorsMigration)
      
      // Try to import quotes migration if it exists
      try {
        const { QuotesMigration } = await import('../types/QuotesMigration.js')
        this.register('quotes', QuotesMigration)
      } catch (error) {
        // QuotesMigration not implemented yet, skip silently
      }

      this.initialized = true
      console.log(`📋 Migration registry initialized with ${this.migrations.size} migration types`)
      
    } catch (error) {
      console.error('❌ Failed to initialize migration registry:', error.message)
      throw error
    }
  }

  /**
   * Register a migration type
   */
  register(type, migrationClass) {
    if (this.migrations.has(type)) {
      throw new Error(`Migration type '${type}' is already registered`)
    }

    // Validate migration class
    if (!this.isValidMigrationClass(migrationClass)) {
      throw new Error(`Invalid migration class for type '${type}'`)
    }

    this.migrations.set(type, {
      type,
      class: migrationClass,
      registeredAt: new Date()
    })

    console.log(`✅ Registered migration type: ${type}`)
  }

  /**
   * Unregister a migration type
   */
  unregister(type) {
    if (!this.migrations.has(type)) {
      throw new Error(`Migration type '${type}' is not registered`)
    }

    this.migrations.delete(type)
    console.log(`❌ Unregistered migration type: ${type}`)
  }

  /**
   * Get available migration types
   */
  getAvailableTypes() {
    return Array.from(this.migrations.keys())
  }

  /**
   * Check if a migration type is registered
   */
  isRegistered(type) {
    return this.migrations.has(type)
  }

  /**
   * Get migration class for a type
   */
  getMigrationClass(type) {
    const migration = this.migrations.get(type)
    if (!migration) {
      throw new Error(`Migration type '${type}' is not registered`)
    }
    return migration.class
  }

  /**
   * Create migration instance
   */
  createMigration(type, options = {}) {
    if (!this.initialized) {
      throw new Error('Migration registry not initialized. Call initialize() first.')
    }

    const MigrationClass = this.getMigrationClass(type)
    return new MigrationClass(options)
  }

  /**
   * Get migration information
   */
  getMigrationInfo(type) {
    const migration = this.migrations.get(type)
    if (!migration) {
      throw new Error(`Migration type '${type}' is not registered`)
    }

    return {
      type: migration.type,
      registeredAt: migration.registeredAt,
      className: migration.class.name
    }
  }

  /**
   * Get all migration information
   */
  getAllMigrationInfo() {
    return Array.from(this.migrations.values()).map(migration => ({
      type: migration.type,
      registeredAt: migration.registeredAt,
      className: migration.class.name
    }))
  }

  /**
   * Validate migration class
   */
  isValidMigrationClass(migrationClass) {
    if (typeof migrationClass !== 'function') {
      return false
    }

    // Check if it has required methods (these should be implemented by BaseMigrator)
    const requiredMethods = [
      'migrate',
      'loadSourceData',
      'transformData',
      'validateData',
      'importData',
      'getTableName'
    ]

    const prototype = migrationClass.prototype
    return requiredMethods.every(method => typeof prototype[method] === 'function')
  }

  /**
   * Run migration by type
   */
  async runMigration(type, options = {}) {
    if (!this.initialized) {
      await this.initialize()
    }

    const migration = this.createMigration(type, options)
    return await migration.migrate()
  }

  /**
   * Get migration statistics
   */
  getRegistryStats() {
    return {
      totalMigrations: this.migrations.size,
      availableTypes: this.getAvailableTypes(),
      initialized: this.initialized,
      registrations: this.getAllMigrationInfo()
    }
  }

  /**
   * Auto-discover migrations from the types directory
   */
  async autoDiscover() {
    const fs = require('fs')
    const path = require('path')
    
    const typesDir = path.join(__dirname, '../types')
    
    if (!fs.existsSync(typesDir)) {
      console.warn('⚠️  Migration types directory not found:', typesDir)
      return
    }

    const files = fs.readdirSync(typesDir)
    const migrationFiles = files.filter(file => 
      file.endsWith('Migration.js') && !file.startsWith('Base')
    )

    console.log(`🔍 Auto-discovering migrations in ${typesDir}`)
    
    for (const file of migrationFiles) {
      try {
        const migrationName = file.replace('Migration.js', '').toLowerCase()
        const modulePath = path.join(typesDir, file)
        
        // Dynamic import
        const module = await import(modulePath)
        const migrationClass = module[file.replace('.js', '')]
        
        if (migrationClass && !this.isRegistered(migrationName)) {
          this.register(migrationName, migrationClass)
        }
      } catch (error) {
        console.warn(`⚠️  Failed to auto-discover migration ${file}:`, error.message)
      }
    }
  }

  /**
   * Validate all registered migrations
   */
  async validateRegistrations() {
    const results = []
    
    for (const [type, migration] of this.migrations) {
      try {
        // Try to create an instance
        const instance = new migration.class({ dryRun: true })
        
        // Check if it has the required methods
        const isValid = this.isValidMigrationClass(migration.class)
        
        results.push({
          type,
          valid: isValid,
          error: null
        })
      } catch (error) {
        results.push({
          type,
          valid: false,
          error: error.message
        })
      }
    }
    
    return results
  }

  /**
   * Clear all registrations (useful for testing)
   */
  clear() {
    this.migrations.clear()
    this.initialized = false
    console.log('🧹 Migration registry cleared')
  }

  /**
   * Get singleton instance
   */
  static getInstance() {
    if (!MigrationRegistry.instance) {
      MigrationRegistry.instance = new MigrationRegistry()
    }
    return MigrationRegistry.instance
  }
}

// Export singleton instance
export const migrationRegistry = MigrationRegistry.getInstance()
