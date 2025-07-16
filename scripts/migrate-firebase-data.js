#!/usr/bin/env node

/**
 * Firebase Data Migration Script (Legacy)
 * DEPRECATED: Use scripts/migrate-data.js instead
 * 
 * This script is maintained for backward compatibility.
 * For new migrations, use: node scripts/migrate-data.js references [options]
 */

console.log('⚠️  DEPRECATED: This script is deprecated.')
console.log('   Please use: node scripts/migrate-data.js references [options]')
console.log('   Redirecting to new migration system...\n')

import { migrationRegistry } from '../server/utils/migration/core/MigrationRegistry.js'

// Legacy wrapper that redirects to new migration system
async function runLegacyMigration() {
  try {
    // Parse legacy arguments
    const options = parseArgs()
    
    // Initialize new migration system
    await migrationRegistry.initialize()
    
    // Create references migration using new system
    const migration = migrationRegistry.createMigration('references', {
      dryRun: options.dryRun,
      batchSize: options.batchSize,
      backupPath: options.backupPath,
      verbose: options.verbose
    })
    
    // Run migration
    await migration.migrate()
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    process.exit(1)
  }
}

// Parse command line arguments (legacy format)
function parseArgs() {
  const args = process.argv.slice(2)
  const options = {
    dryRun: false,
    batchSize: 50,
    backupPath: null,
    verbose: false
  }
  
  args.forEach(arg => {
    if (arg === '--dry-run') {
      options.dryRun = true
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true
    } else if (arg.startsWith('--batch-size=')) {
      options.batchSize = parseInt(arg.split('=')[1], 10) || 50
    } else if (arg.startsWith('--backup-path=')) {
      options.backupPath = arg.split('=')[1]
    }
  })
  
  return options
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  runLegacyMigration()
}
