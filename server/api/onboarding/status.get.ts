import { db, schema } from 'hub:db'
import { sql, count, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    // Check if database tables exist by trying to query them
    let hasDatabase = false
    try {
      await db.select({ val: sql`1` }).from(schema.users).limit(1).get()
      hasDatabase = true
    } catch (error) {
      // Database tables don't exist yet
      hasDatabase = false
    }

    if (!hasDatabase) {
      return {
        success: true,
        data: {
          needsOnboarding: true,
          hasDatabase: false,
          hasAdminUser: false,
          hasData: false,
          step: 'database_init'
        }
      }
    }

    // Check for admin users
    const [adminCount] = await db.select({ count: count() })
      .from(schema.users)
      .where(eq(schema.users.role, 'admin'))

    const hasAdminUser = (adminCount?.count || 0) > 0

    // Check if database has data (quotes)
    const [quotesCount] = await db.select({ count: count() }).from(schema.quotes)

    const hasData = (quotesCount?.count || 0) > 0

    // Determine onboarding step needed
    let step = null
    let needsOnboarding = false

    if (!hasAdminUser) {
      needsOnboarding = true
      step = 'admin_user'
    } else if (!hasData) {
      needsOnboarding = true
      step = 'database_data'
    }

    // Get basic stats if data exists
    let stats = null
    if (hasData) {
      const [[authorsCount], [referencesCount]] = await Promise.all([
        db.select({ count: count() }).from(schema.authors),
        db.select({ count: count() }).from(schema.quoteReferences)
      ])

      stats = {
        quotes: quotesCount?.count || 0,
        authors: authorsCount?.count || 0,
        references: referencesCount?.count || 0
      }
    }

    return {
      success: true,
      data: {
        needsOnboarding,
        hasDatabase,
        hasAdminUser,
        hasData,
        step,
        stats
      }
    }

  } catch (error: any) {
    console.error('Onboarding status check error:', error)
    return {
      success: false,
      message: error?.message || 'Failed to check onboarding status',
      data: {
        needsOnboarding: true,
        hasDatabase: false,
        hasAdminUser: false,
        hasData: false,
        step: 'database_init'
      }
    }
  }
})
