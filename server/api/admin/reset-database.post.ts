import { db, schema } from 'hub:db'
import { hashPasswordWorker } from '../../utils/password'

/**
 * Clears user-owned catalogue data while preserving application configuration
 * and operational history. The schema and the configured admin account are
 * recreated/kept intact; imported/exported archive files are not touched.
 */
export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireAdmin(event)
    const body = await readBody<{ confirmationToken?: string }>(event)

    if (body?.confirmationToken !== 'RESET_DATABASE_CONFIRMED') {
      throwServer(400, 'Explicit database reset confirmation is required.')
    }

    // Never recreate an administrator with the public fallback password used
    // by the generic bootstrap helper. Fail before any destructive statement.
    const adminPassword = process.env.USER_PASSWORD
    if (!adminPassword?.trim()) {
      throwServer(409, 'Database reset requires USER_PASSWORD to be configured so the admin account can be recreated safely.')
    }

    const adminName = process.env.USER_USERNAME || 'root'
    const adminEmail = process.env.USER_EMAIL || 'admin@localhost'
    const hashedPassword = await hashPasswordWorker(adminPassword)

    const clearStatements = [
      // Content-derived joins and activity tied to entities being removed.
      db.delete(schema.quoteSources),
      db.delete(schema.quoteAttributions),
      db.delete(schema.quoteTags),
      db.delete(schema.collectionQuotes),
      db.delete(schema.socialPosts),
      db.delete(schema.socialQueue),
      db.delete(schema.userLikes),
      db.delete(schema.quoteViews),
      db.delete(schema.authorViews),
      db.delete(schema.referenceViews),
      db.delete(schema.quoteReports),
      db.delete(schema.userMessages),

      // User-specific credentials and collections.
      db.delete(schema.apiKeyUsageLogs),
      db.delete(schema.apiKeys),
      db.delete(schema.passwordResetTokens),
      db.delete(schema.emailVerificationTokens),
      db.delete(schema.emailChangeTokens),
      db.delete(schema.userSessions),
      db.delete(schema.userCollections),

      // Enrichment state is scoped to author/reference entities; remove it
      // alongside those entities to avoid stale jobs pointing at reused IDs.
      db.delete(schema.entityEnrichmentFieldProposals),
      db.delete(schema.entityFieldChangeHistory),
      db.delete(schema.entityVerificationState),
      db.delete(schema.entityEnrichmentJobs),
      db.delete(schema.entitySuggestions),

      // User-owned catalogue content and account rows.
      db.delete(schema.quotes),
      db.delete(schema.tags),
      db.delete(schema.authors),
      db.delete(schema.quoteReferences),
      db.delete(schema.users),

      // Create a fresh administrator in the same D1 batch as the deletions.
      db.insert(schema.users).values({
        name: adminName,
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
        isActive: true,
        emailVerified: true,
      }),
    ]

    await db.batch(clearStatements as any)
    const tablesCleared = clearStatements.length - 1

    console.warn(`User/content reset completed by admin ${user.name} (${user.email}); operational history and archives were preserved.`)

    try {
      await clearUserSession(event)
    } catch (sessionError) {
      console.error('Failed to clear the current admin session after reset:', sessionError)
    }

    return {
      success: true,
      message: 'User and content data cleared successfully',
      data: {
        loggedOut: true,
        redirectTo: '/',
        tablesCleared,
        adminUserReinitialized: true,
        timestamp: new Date().toISOString(),
      },
    }
  } catch (error: any) {
    console.error('User/content reset failed:', error)
    if (error?.statusCode) throw error
    throwServer(500, error?.statusMessage || 'User and content reset failed')
  }
})
