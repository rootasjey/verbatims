import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const session = await getUserSession(event)
    if (!session.user) {
      throwServer(401, 'Authentication required')
    }
    if (session.user!.role !== 'admin') {
      throwServer(403, 'Admin access required')
    }

    const body = await readBody(event)
    const { name, email, password, role = 'user', is_active = true, email_verified = false, avatar_url = null } = body || {}

    if (!name || !email || !password) {
      throwServer(400, 'Name, email and password are required')
    }

    if (typeof name !== 'string' || name.length < 1 || name.length > 70) {
      throwServer(400, 'Invalid name length')
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throwServer(400, 'Invalid email format')
    }

    if (typeof password !== 'string' || password.length < 8) {
      throwServer(400, 'Password must be at least 8 characters long')
    }

    if (!['user', 'moderator', 'admin'].includes(role)) {
      throwServer(400, 'Invalid role')
    }

    // Check existing by email
    const existing = await db.select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1)
    
    if (existing.length > 0) {
      throwServer(409, 'Email already in use')
    }

    // Hash password (nuxt-auth-utils)
    const hashedPassword = await hashPassword(password)

    const result = await db.insert(schema.users).values({
      name,
      email,
      password: hashedPassword,
      avatarUrl: avatar_url,
      role: role as any,
      isActive: is_active,
      emailVerified: email_verified
    }).returning()

    if (!result || result.length === 0) {
      throwServer(500, 'Failed to create user')
    }

    const created = {
      ...result[0],
      quote_count: 0,
      approved_quotes: 0,
      collection_count: 0,
      likes_given: 0,
      total_likes_received: 0
    }

    return { success: true, data: created, message: 'User created successfully' }
  } catch (error: any) {
    if ((error as any).statusCode) throw error
    console.error('Admin create user error:', error)
    throwServer(500, 'Failed to create user')
  }
})
