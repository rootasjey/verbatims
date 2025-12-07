export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { username, email, password, adminPassword } = body

    // Validate required fields
    if (!username || !email || !password || !adminPassword) {
      throw createError({
        statusCode: 400,
        statusMessage: 'All fields are required'
      })
    }

    // Verify admin authorization password
    const requiredAdminPassword = process.env.ADMIN_PASSWORD || 'Verbatims@Admin2024!'
    if (adminPassword !== requiredAdminPassword) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Invalid admin authorization password'
      })
    }

    const db = hubDatabase()
    if (!db) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Database not available'
      })
    }

    // Initialize database schema first if needed
    try {
      await db.prepare('SELECT 1 FROM users LIMIT 1').first()
    } catch (error) {
      // Database tables don't exist, initialize them
      const initSuccess = await initializeDatabase()
      if (!initSuccess) {
        throw createError({
          statusCode: 500,
          statusMessage: 'Failed to initialize database schema'
        })
      }
    }

    // Check if any admin user already exists
    const existingAdmin = await db.prepare(`
      SELECT id, name, email FROM users WHERE role = 'admin' LIMIT 1
    `).first()

    if (existingAdmin) {
      throw createError({
        statusCode: 409,
        statusMessage: 'An admin user already exists'
      })
    }

    // Check if user with this email or username already exists
    const existingUser = await db.prepare(`
      SELECT id, name, email, role FROM users WHERE email = ? OR name = ? LIMIT 1
    `).bind(email, username).first()

    if (existingUser) {
      throw createError({
        statusCode: 409,
        statusMessage: 'User with this email or username already exists'
      })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid email format'
      })
    }

    // Validate password strength
    if (password.length < 8) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Password must be at least 8 characters long'
      })
    }

    // Hash the password using nuxt-auth-utils
    const hashedPassword = await hashPassword(password)

    // Create new admin user
    const result = await db.prepare(`
      INSERT INTO users (name, email, password, role, is_active, email_verified, created_at, updated_at)
      VALUES (?, ?, ?, 'admin', TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).bind(username, email, hashedPassword).run()

    if (!result.success) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to create admin user'
      })
    }

    // Get the created user (without password)
    const createdUser = await db.prepare(`
      SELECT id, name, email, role, created_at FROM users WHERE id = ?
    `).bind(result.meta.last_row_id).first()

    console.log(`✅ Admin user created successfully: ${username} (${email})`)
    if (!createdUser) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to retrieve created admin user'
      })
    }

    return {
      success: true,
      message: 'Admin user created successfully',
      data: {
        user: {
          id: createdUser.id,
          name: createdUser.name,
          email: createdUser.email,
          role: createdUser.role,
          createdAt: createdUser.created_at
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
    throw createError({
      statusCode: 500,
      statusMessage: error?.message || 'Failed to create admin user'
    })
  }
})
