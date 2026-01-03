/**
 * Admin API: Reset Database
 * Completely resets the database by dropping all tables and recreating the schema
 *
 * SECURITY WARNING: This is a destructive operation that will permanently delete all data
 * Only accessible to admin users with proper authentication
 */
import { db, schema } from 'hub:db'
import { sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireUserSession(event)
    if (!user || user.role !== 'admin') throwServer(403, 'Admin access required for database reset operations')

    const body = await readBody(event)
    const { confirmationToken } = body

    // Additional security: require confirmation token
    if (!confirmationToken || confirmationToken !== 'RESET_DATABASE_CONFIRMED') {
      throwServer(400, 'Database reset requires explicit confirmation token')
    }

    console.log(`🔥 Database reset initiated by admin user: ${user.name} (${user.email})`)
    
    // Step 1: CLEAR all tables (no DDL) — use DELETE in a safe FK order
    // Note: Some tables cascade on parent deletes; we still clear explicitly for completeness and resilience
    console.log('🧹 Clearing all tables (DELETE, no DROP)...')

    const clearOrder = [
      // Leaf and junction tables
      { table: 'quote_tags', schema: schema.quoteTags },
      { table: 'collection_quotes', schema: schema.collectionQuotes },
      { table: 'quote_views', schema: schema.quoteViews },
      { table: 'author_views', schema: schema.authorViews },
      { table: 'reference_views', schema: schema.referenceViews },
      { table: 'quote_reports', schema: schema.quoteReports },
      { table: 'user_messages', schema: schema.userMessages },
      { table: 'user_sessions', schema: schema.userSessions },
      { table: 'user_likes', schema: schema.userLikes },
      { table: 'backup_files', schema: schema.backupFiles },
      { table: 'export_logs', schema: schema.exportLogs },
      { table: 'import_logs', schema: schema.importLogs },
      { table: 'user_collections', schema: schema.userCollections },
      // Core content tables
      { table: 'quotes', schema: schema.quotes },
      { table: 'tags', schema: schema.tags },
      { table: 'authors', schema: schema.authors },
      { table: 'quote_references', schema: schema.quoteReferences },
      // Users last (referenced by many tables)
      { table: 'users', schema: schema.users }
    ] as const

    let tablesCleared = 0
    let rowsDeleted = 0
    for (const { table, schema: tableSchema } of clearOrder) {
      try {
        const result = await db.delete(tableSchema as any)
        // Note: Drizzle doesn't return affected rows count, so we estimate
        tablesCleared++
        console.log(`✅ Cleared table '${table}'`) 
      } catch (e: any) {
        // If a table does not exist in a given environment or DELETE is not authorized, surface a clear error
        console.error(`❌ Failed to clear table '${table}':`, e?.message || e)
        throwServer(500, `Failed to clear table '${table}': ${e?.message || e}`)
      }
    }

    // Step 2: Reset AUTOINCREMENT sequences for tables using INTEGER PRIMARY KEY AUTOINCREMENT
    // This ensures IDs start from 1 again after a full data wipe
    console.log('🔢 Resetting AUTOINCREMENT sequences...')
    const autoIncrementTables = [
      'users',
      'authors',
      'quote_references',
      'quotes',
      'tags',
      'user_likes',
      'user_collections',
      'user_sessions',
      'quote_reports',
      'user_messages',
      'quote_views',
      'author_views',
      'reference_views',
      'export_logs',
      'import_logs',
      'backup_files'
    ] as const

    let sequencesReset = 0
    try {
      for (const table of autoIncrementTables) {
        try {
          await db.run(sql`DELETE FROM sqlite_sequence WHERE name = ${table}`)
          sequencesReset++
          console.log(`✅ Reset sequence for '${table}'`)
        } catch (seqErr: any) {
          // In some environments sqlite_sequence may not exist yet; ignore specific error
          const msg = String(seqErr?.message || seqErr)
          if (msg.includes('no such table: sqlite_sequence')) {
            console.warn('ℹ️  sqlite_sequence table not found; skipping sequence resets')
            break
          }
          console.warn(`⚠️  Failed to reset sequence for '${table}':`, msg)
        }
      }
    } catch (outerSeqErr) {
      console.warn('⚠️  Sequence reset encountered issues:', outerSeqErr)
    }

    // Step 3: Initialize admin user (since all users were deleted)
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

    // Proactively clear the current user's auth session (logout) after data reset
    // This removes any session cookies/tokens so the client is effectively logged out.
    try {
      await clearUserSession(event)
      console.log('🔐 User session cleared after database reset')
    } catch (sessionClearError) {
      console.warn('⚠️  Failed to clear user session after reset:', sessionClearError)
      // Continue: session table is cleared anyway; cookie clearing might have failed
    }

    return {
      success: true,
      message: 'Database data cleared successfully',
      // Hint to clients that server cleared the session and where to go next
      loggedOut: true,
      redirectTo: '/',
      data: {
        tablesCleared,
        rowsDeleted,
        sequencesReset,
        adminUserReinitialized,
        timestamp: new Date().toISOString()
      }
    }

  } catch (error: any) {
    // Log the error for debugging
    console.error('🚨 Database reset failed:', error)
    // Return appropriate error response
    throwServer(error.statusCode || 500, error.statusMessage || 'Database reset operation failed')
  }
})
