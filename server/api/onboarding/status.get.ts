export default defineEventHandler(async (event) => {
  try {
    const db = hubDatabase()

    if (!db) {
      return {
        success: false,
        message: 'Database not available',
        data: {
          needsOnboarding: true,
          hasDatabase: false,
          hasAdminUser: false,
          hasData: false,
          step: 'database_init'
        }
      }
    }

    // Check if database tables exist by trying to query them
    let hasDatabase = false
    try {
      await db.prepare('SELECT 1 FROM users LIMIT 1').first()
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
    const adminCount = await db.prepare(`
      SELECT COUNT(*) as count FROM users WHERE role = 'admin'
    `).first()

    const hasAdminUser = (adminCount?.count || 0) > 0

    // Check if database has data (quotes)
    const quotesCount = await db.prepare(`
      SELECT COUNT(*) as count FROM quotes
    `).first()

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
      const [authorsCount, referencesCount] = await Promise.all([
        db.prepare('SELECT COUNT(*) as count FROM authors').first(),
        db.prepare('SELECT COUNT(*) as count FROM quote_references').first()
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
