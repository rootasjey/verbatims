import { db, schema } from 'hub:db'
import { eq, count } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireModerator(event)

    if (!db) {
      return {
        success: false,
        message: 'Database not available',
        data: {
          hasDatabase: false,
          hasAdminUser: false,
          adminUsers: [] as Array<{ id: number; email: string; name: string }>
        }
      }
    }

    // Check for admin users
    const adminUsers = await db.select({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      created_at: schema.users.createdAt,
      last_login_at: schema.users.lastLoginAt,
      is_active: schema.users.isActive
    })
    .from(schema.users)
    .where(eq(schema.users.role, 'admin'))
    .orderBy(schema.users.createdAt)

    // Get total user count
    const userCountResult = await db.select({ count: count() })
      .from(schema.users)

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
        hasAdminUser: adminUsers.length > 0,
        adminUserCount: adminUsers.length,
        totalUserCount: userCountResult[0]?.count || 0,
        adminUsers: adminUsers.map(user => ({
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
    if (error?.statusCode) throw error
    console.error('Admin status check error:', error)
    throwServer(500, 'Failed to check admin status')
  }
})
