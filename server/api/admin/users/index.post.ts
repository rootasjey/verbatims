export default defineEventHandler(async (event) => {
  try {
    const session = await getUserSession(event)
    if (!session.user) {
      throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
    }
    if (session.user.role !== 'admin') {
      throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
    }

    const body = await readBody(event)
    const { name, email, password, role = 'user', is_active = true, email_verified = false, avatar_url = null } = body || {}

    if (!name || !email || !password) {
      throw createError({ statusCode: 400, statusMessage: 'Name, email and password are required' })
    }

    if (typeof name !== 'string' || name.length < 1 || name.length > 70) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid name length' })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid email format' })
    }

    if (typeof password !== 'string' || password.length < 8) {
      throw createError({ statusCode: 400, statusMessage: 'Password must be at least 8 characters long' })
    }

    if (!['user', 'moderator', 'admin'].includes(role)) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid role' })
    }

    const db = hubDatabase()

    // Check existing by email
    const existing = await db.prepare('SELECT id FROM users WHERE email = ? LIMIT 1').bind(email).first()
    if (existing) {
      throw createError({ statusCode: 409, statusMessage: 'Email already in use' })
    }

    // Hash password (nuxt-auth-utils)
    const hashedPassword = await hashPassword(password)

    const result = await db.prepare(`
      INSERT INTO users (name, email, password, avatar_url, role, is_active, email_verified, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).bind(name, email, hashedPassword, avatar_url, role, is_active ? 1 : 0, email_verified ? 1 : 0).run()

    if (!result.success) {
      throw createError({ statusCode: 500, statusMessage: 'Failed to create user' })
    }

    const created = await db.prepare(`
      SELECT 
        u.*,
        0 as quote_count,
        0 as approved_quotes,
        0 as collection_count,
        0 as likes_given,
        0 as total_likes_received
      FROM users u WHERE u.id = ?
    `).bind(result.meta.last_row_id).first()

    return { success: true, data: created, message: 'User created successfully' }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('Admin create user error:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to create user' })
  }
})
