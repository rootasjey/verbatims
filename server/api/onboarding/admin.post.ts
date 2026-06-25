import { db, schema } from 'hub:db'
import { eq, or, sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { username, email, password, adminPassword } = body

    // Validate required fields
    if (!username || !email || !password || !adminPassword) {
      throwServer(400, 'All fields are required')
    }

    // Verify admin authorization password
    const requiredAdminPassword = process.env.ADMIN_PASSWORD || 'Verbatims@Admin2024!'
    if (adminPassword !== requiredAdminPassword) {
      throwServer(403, 'Invalid admin authorization password')
    }

    // Initialize database schema first if needed
    try {
      await db.select({ val: sql`1` }).from(schema.users).limit(1).get()
    } catch (error) {
      // Database tables don't exist, initialize them
      const initSuccess = await initializeDatabase()
      if (!initSuccess) {
        throwServer(500, 'Failed to initialize database schema')
      }
    }

    // Check if any admin user already exists
    const [existingAdmin] = await db.select({ id: schema.users.id, name: schema.users.name, email: schema.users.email })
      .from(schema.users)
      .where(eq(schema.users.role, 'admin'))
      .limit(1)

    if (existingAdmin) {
      throwServer(409, 'An admin user already exists')
    }

    // Check if user with this email or username already exists
    const [existingUser] = await db.select({ id: schema.users.id, name: schema.users.name, email: schema.users.email, role: schema.users.role })
      .from(schema.users)
      .where(or(eq(schema.users.email, email), eq(schema.users.name, username)))
      .limit(1)

    if (existingUser) {
      throwServer(409, 'User with this email or username already exists')
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throwServer(400, 'Invalid email format')
    }

    // Validate password strength
    if (password.length < 8) {
      throwServer(400, 'Password must be at least 8 characters long')
    }

    // Hash the password using nuxt-auth-utils
    const hashedPassword = await hashPassword(password)

    // Create new admin user
    const [createdUser] = await db.insert(schema.users).values({
      name: username,
      email,
      password: hashedPassword,
      role: 'admin',
      isActive: true,
      emailVerified: true
    }).returning({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      role: schema.users.role,
      createdAt: schema.users.createdAt
    })

    console.log(`✅ Admin user created successfully: ${username} (${email})`)
    if (!createdUser) throwServer(500, 'Failed to retrieve created admin user')

    return {
      success: true,
      message: 'Admin user created successfully',
      data: {
        user: {
          id: createdUser!.id,
          name: createdUser!.name,
          email: createdUser!.email,
          role: createdUser!.role,
          createdAt: createdUser!.createdAt
        }
      }
    }

  } catch (error: any) {
    console.error('Admin user creation error:', error)
    
    // If it's already a createError, re-throw it
    if ((error as any).statusCode) {
      throw error
    }

    // Otherwise, create a generic error
    throwServer(500, error?.message || 'Failed to create admin user')
  }
})
