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

    // Step 1: CLEAR all tables (no DDL) — use DELETE in a safe FK order
    // Note: Some tables cascade on parent deletes; we still clear explicitly for completeness and resilience
    console.log('🧹 Clearing all tables (DELETE, no DROP)...')

    const clearOrder = [
      // Leaf and junction tables
      'quote_tags',
      'collection_quotes',
      'quote_views',
      'author_views',
      'reference_views',
      'quote_reports',
      'user_messages',
      'user_sessions',
      'user_likes',
      'backup_files',
      'export_logs',
      'import_logs',
      'user_collections',
      // Core content tables
      'quotes',
      'tags',
      'authors',
      'quote_references',
      // Users last (referenced by many tables)
      'users'
    ] as const

    let tablesCleared = 0
    let rowsDeleted = 0
    for (const table of clearOrder) {
      try {
        const res = await db.prepare(`DELETE FROM ${table}`).run()
        const changes = Number(res?.meta?.changes || 0)
        rowsDeleted += changes
        tablesCleared++
        console.log(`✅ Cleared table '${table}' (deleted ${changes} rows)`) 
      } catch (e: any) {
        // If a table does not exist in a given environment or DELETE is not authorized, surface a clear error
        console.error(`❌ Failed to clear table '${table}':`, e?.message || e)
        throw createError({
          statusCode: 500,
          statusMessage: `Failed to clear table '${table}': ${e?.message || e}`
        })
      }
    }

    // Step 2: Initialize admin user (since all users were deleted)
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
      message: 'Database data cleared successfully',
      data: {
        tablesCleared,
        rowsDeleted,
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
