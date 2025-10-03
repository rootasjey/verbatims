export default defineEventHandler(async (event) => {
  try {
    const db = hubDatabase()
    if (!db) {
      return {
        success: false,
        message: 'Database not available',
        data: {
          hasDatabase: false,
          hasAdminUser: false,
          adminUsers: []
        }
      }
    }

    // Check for admin users
    const adminUsers = await db.prepare(`
      SELECT id, name, email, created_at, last_login_at, is_active
      FROM users 
      WHERE role = 'admin'
      ORDER BY created_at ASC
    `).all()

    // Get total user count
    const userCount = await db.prepare(`
      SELECT COUNT(*) as count FROM users
    `).first()

    // Get environment variable status (without exposing values)
    const envStatus = {
      hasUserUsername: !!process.env.USER_USERNAME,
      hasUserEmail: !!process.env.USER_EMAIL,
      hasUserPassword: !!process.env.USER_PASSWORD
    }

    return {
      success: true,
      data: {
        hasDatabase: true,
        hasAdminUser: adminUsers.results.length > 0,
        adminUserCount: adminUsers.results.length,
        totalUserCount: userCount?.count || 0,
        adminUsers: adminUsers.results.map(user => ({
          id: user.id,
          name: user.name,
          email: user.email,
          createdAt: user.created_at,
          lastLoginAt: user.last_login_at,
          isActive: user.is_active
        })),
        environmentVariables: envStatus
      }
    }

  } catch (error: any) {
    console.error('Admin status check error:', error)
    return {
      success: false,
      message: error?.message || 'Failed to check admin status',
      data: {
        hasDatabase: false,
        hasAdminUser: false,
        adminUsers: []
      }
    }
  }
})
