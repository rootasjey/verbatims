#!/usr/bin/env node

/**
 * Unified Migration Script
 * Supports multiple migration types using the modular migration framework.
 * Usage: node scripts/migrate-data.js [type] [options]
 */

import { migrationRegistry } from '../server/utils/migration/core/MigrationRegistry.js'

class MigrationCLI {
  constructor() {
    this.availableTypes = []
    this.options = {
      type: null,
      dryRun: false,
      batchSize: 50,
      backupPath: null,
      verbose: false,
      help: false,
      list: false
    }
  }

  async initialize() {
    try {
      await migrationRegistry.initialize()
      this.availableTypes = migrationRegistry.getAvailableTypes()
    } catch (error) {
      console.error('❌ Failed to initialize migration registry:', error.message)
      process.exit(1)
    }
  }

  parseArgs() {
    const args = process.argv.slice(2)
    
    for (let i = 0; i < args.length; i++) {
      const arg = args[i]
      
      if (arg === '--help' || arg === '-h') {
        this.options.help = true
      } else if (arg === '--list' || arg === '-l') {
        this.options.list = true
      } else if (arg === '--dry-run') {
        this.options.dryRun = true
      } else if (arg === '--verbose' || arg === '-v') {
        this.options.verbose = true
      } else if (arg.startsWith('--batch-size=')) {
        this.options.batchSize = parseInt(arg.split('=')[1], 10) || 50
      } else if (arg.startsWith('--backup-path=')) {
        this.options.backupPath = arg.split('=')[1]
      } else if (!arg.startsWith('--') && !this.options.type) {
        // First non-option argument is the migration type
        this.options.type = arg
      }
    }
  }

  showHelp() {
    console.log(`
🚀 Unified Migration Script

USAGE:
  node scripts/migrate-data.js [type] [options]

MIGRATION TYPES:
  ${this.availableTypes.map(type => `${type.padEnd(12)} - Migrate ${type} data`).join('\n  ')}

OPTIONS:
  --help, -h           Show this help message
  --list, -l           List available migration types
  --dry-run            Run validation without importing data
  --verbose, -v        Enable verbose output
  --batch-size=N       Set batch size (default: 50)
  --backup-path=PATH   Set custom backup file path

EXAMPLES:
  node scripts/migrate-data.js references --dry-run
  node scripts/migrate-data.js authors --verbose --batch-size=25
  node scripts/migrate-data.js quotes --backup-path=custom/path.json
  node scripts/migrate-data.js --list

NOTES:
  - Use --dry-run first to validate data without importing
  - Default backup paths are automatically detected
  - All migration files are organized in server/database/backups/[type]/
`)
  }

  showList() {
    console.log('📋 Available Migration Types:\n')
    
    const registryStats = migrationRegistry.getRegistryStats()
    
    registryStats.registrations.forEach(migration => {
      console.log(`🔹 ${migration.type}`)
      console.log(`   Class: ${migration.className}`)
      console.log(`   Registered: ${new Date(migration.registeredAt).toLocaleString()}`)
      console.log()
    })
    
    console.log(`Total: ${registryStats.totalMigrations} migration types available`)
  }

  validateOptions() {
    if (this.options.help || this.options.list) {
      return true // These don't need further validation
    }

    if (!this.options.type) {
      console.error('❌ Migration type is required')
      console.error('   Use --help to see available types')
      return false
    }

    if (!this.availableTypes.includes(this.options.type)) {
      console.error(`❌ Unknown migration type: ${this.options.type}`)
      console.error(`   Available types: ${this.availableTypes.join(', ')}`)
      return false
    }

    if (this.options.batchSize < 1 || this.options.batchSize > 1000) {
      console.error('❌ Batch size must be between 1 and 1000')
      return false
    }

    return true
  }

  async runMigration() {
    try {
      console.log(`🚀 Starting ${this.options.type} migration`)
      console.log('='.repeat(50))
      
      // Create migration instance
      const migration = migrationRegistry.createMigration(this.options.type, {
        dryRun: this.options.dryRun,
        batchSize: this.options.batchSize,
        backupPath: this.options.backupPath,
        verbose: this.options.verbose
      })
      
      // Run migration
      await migration.migrate()
      
      console.log('\n🎉 Migration completed successfully!')
      
    } catch (error) {
      console.error('\n❌ Migration failed:', error.message)
      if (this.options.verbose) {
        console.error(error.stack)
      }
      process.exit(1)
    }
  }

  async run() {
    await this.initialize()
    this.parseArgs()

    if (!this.validateOptions()) {
      process.exit(1)
    }

    if (this.options.help) {
      this.showHelp()
      return
    }

    if (this.options.list) {
      this.showList()
      return
    }

    await this.runMigration()
  }
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const cli = new MigrationCLI()
  cli.run().catch(error => {
    console.error('❌ CLI failed:', error.message)
    process.exit(1)
  })
}

export { MigrationCLI }
