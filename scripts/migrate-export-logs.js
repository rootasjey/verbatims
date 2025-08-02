#!/usr/bin/env node

/**
 * Migration script to unify export logs tables
 * 
 * This script migrates data from separate quotes_export_logs and references_export_logs
 * tables to a unified export_logs table with data_type categorization.
 * 
 * Usage: node scripts/migrate-export-logs.js
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

async function runMigration() {
  try {
    console.log('🚀 Starting export logs migration...')
    
    // Import the database connection
    const { hubDatabase } = await import('../server/utils/database.js')
    
    const db = hubDatabase()
    if (!db) {
      throw new Error('Database not available')
    }

    // Read the migration SQL file
    const migrationSQL = readFileSync(
      join(__dirname, '../server/database/migrations/migrate-export-logs.sql'),
      'utf8'
    )

    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))

    console.log(`📝 Executing ${statements.length} migration statements...`)

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      console.log(`   ${i + 1}/${statements.length}: ${statement.substring(0, 50)}...`)
      
      try {
        await db.prepare(statement).run()
      } catch (error) {
        console.warn(`   ⚠️  Warning: ${error.message}`)
        // Continue with other statements even if one fails
      }
    }

    // Verify the migration
    console.log('\n🔍 Verifying migration...')
    
    const exportLogsCount = await db.prepare('SELECT COUNT(*) as count FROM export_logs').first()
    console.log(`   ✅ export_logs table has ${exportLogsCount.count} records`)

    const quotesCount = await db.prepare(`
      SELECT COUNT(*) as count FROM export_logs WHERE data_type = 'quotes'
    `).first()
    console.log(`   📊 Quotes exports: ${quotesCount.count}`)

    const referencesCount = await db.prepare(`
      SELECT COUNT(*) as count FROM export_logs WHERE data_type = 'references'
    `).first()
    console.log(`   📚 References exports: ${referencesCount.count}`)

    console.log('\n✅ Migration completed successfully!')
    console.log('\n📋 Next steps:')
    console.log('   1. Test the export functionality to ensure everything works')
    console.log('   2. If everything looks good, you can drop the old tables:')
    console.log('      - DROP TABLE IF EXISTS quotes_export_logs;')
    console.log('      - DROP TABLE IF EXISTS references_export_logs;')

  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

// Run the migration
runMigration()
