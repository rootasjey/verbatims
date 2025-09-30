/**
 * Admin API: Reset Database
 * Completely resets the database by dropping all tables and recreating the schema
 *
 * SECURITY WARNING: This is a destructive operation that will permanently delete all data
 * Only accessible to admin users with proper authentication
 */

import { initializeDatabase, initializeAdminUser } from '~/server/utils/database'

export default defineEventHandler(async (event) => {
  try {
    // Check admin permissions - require strict admin role (not moderator)
    const { user } = await requireUserSession(event)
    if (!user || user.role !== 'admin') {
      throw createError({
        statusCode: 403,
        statusMessage: 'Admin access required for database reset operations'
      })
    }

    const body = await readBody(event)
    const { confirmationToken } = body

    // Additional security: require confirmation token
    if (!confirmationToken || confirmationToken !== 'RESET_DATABASE_CONFIRMED') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Database reset requires explicit confirmation token'
      })
    }

    const db = hubDatabase()
    console.log(`🔥 Database reset initiated by admin user: ${user.name} (${user.email})`)

    // Optional: Create automatic backup before reset (uncomment to enable)
    // console.log('📦 Creating automatic backup before reset...')
    // try {
    //   const backupManager = getBackupManager()
    //   const backup = await backupManager.createBackup(`Pre-reset backup by ${user.name}`)
    //   console.log(`✅ Backup created: ${backup.id}`)
    // } catch (backupError) {
    //   console.warn('⚠️  Failed to create backup before reset:', backupError)
    //   // Continue with reset even if backup fails
    // }

    // Get list of all tables before dropping
    const tables = await db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `).all()

    const tableNames = tables.results
      .map((t: any) => t.name)
      .filter((name: string) => !name.match(/_cf_METADATA/i))

    // const tableNames = tables.map(t => t.name)
    console.log(`📋 Found ${tableNames.length} tables to drop:`, tableNames)

    // Step 1: Drop all existing tables safely (disable FKs)
    console.log('🗑️  Dropping all existing tables...')

    let droppedCount = 0
    try {
      // Disable foreign key enforcement for the connection
      await db.prepare('PRAGMA foreign_keys = OFF').run()

      // Drop each table sequentially to avoid transaction issues
      for (const tableName of tableNames) {
        await db.prepare(`DROP TABLE IF EXISTS ${tableName}`).run()
        droppedCount++
        console.log(`✅ Dropped table: ${tableName}`)
      }
    } catch (error: any) {
      console.error('❌ Failed to drop tables:', error)
      throw createError({
        statusCode: 500,
        statusMessage: `Failed to drop tables: ${error.message}`
      })
    } finally {
      // Re-enable foreign keys
      try {
        await db.prepare('PRAGMA foreign_keys = ON').run()
      } catch {}
    }

    // Step 2: Recreate database schema from schema.sql
    console.log('🏗️  Recreating database schema...')
    try {
      const schemaInitialized = await initializeDatabase()
      if (!schemaInitialized) {
        throw createError({
          statusCode: 500,
          statusMessage: 'Failed to recreate database schema'
        })
      }
      console.log('✅ Database schema recreated successfully')
    } catch (schemaError: any) {
      console.error('❌ Failed to recreate schema:', schemaError)
      throw createError({
        statusCode: 500,
        statusMessage: `Failed to recreate database schema: ${schemaError.message}`
      })
    }

    // Count created tables
    const createdTablesQuery = await db.prepare(`
      SELECT COUNT(*) as count FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '%_cf_METADATA%'
    `).first()
    const createdTables = Number(createdTablesQuery?.count || 0)

    // Step 3: Initialize admin user (since all data was wiped)
    console.log('👤 Reinitializing admin user...')
    let adminUserReinitialized = false
    try {
      adminUserReinitialized = await initializeAdminUser()
      if (!adminUserReinitialized) {
        console.warn('⚠️  Warning: Failed to reinitialize admin user after reset')
      } else {
        console.log('✅ Admin user reinitialized successfully')
      }
    } catch (adminError) {
      console.error('❌ Failed to reinitialize admin user:', adminError)
      // Don't fail the entire operation for this
    }

    // Log successful completion with full details
    console.log(`🎉 Database reset completed successfully by ${user.name} (${user.email})`)
    console.log(`⏱️  Operation completed at: ${new Date().toISOString()}`)

    return {
      success: true,
      message: 'Database reset completed successfully',
      data: {
        droppedTables: droppedCount,
        createdTables,
        adminUserReinitialized,
        timestamp: new Date().toISOString()
      }
    }

  } catch (error: any) {
    // Log the error for debugging
    console.error('🚨 Database reset failed:', error)
    
    // Return appropriate error response
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Database reset operation failed'
    })
  }
})
