import { z } from 'zod'

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
})

export default defineEventHandler(async (event) => {
  const { email, password } = await readValidatedBody(event, bodySchema.parse)

  try {
    // Find user by email
    const userData = await hubDatabase()
      .prepare('SELECT * FROM users WHERE email = ?1 LIMIT 1')
      .bind(email)
      .first()

    if (!userData) {
      throw createError({
        statusCode: 401,
        message: 'Invalid email or password'
      })
    }

    // Check if user has a password (might be OAuth-only user)
    if (!userData.password) {
      throw createError({
        statusCode: 401,
        message: 'This account uses social login. Please sign in with your social provider.'
      })
    }

    // Verify password using nuxt-auth-utils
    const isValidPassword = await verifyPassword(userData.password as string, password)

    if (!isValidPassword) {
      throw createError({
        statusCode: 401,
        message: 'Invalid email or password'
      })
    }

    // Update last login timestamp
    await hubDatabase()
      .prepare('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?1')
      .bind(userData.id)
      .run()

    const user = {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      created_at: userData.created_at,
      avatar_url: userData.avatar_url,
      biography: userData.biography,
      job: userData.job,
      language: userData.language,
      location: userData.location,
      socials: userData.socials,
      updated_at: userData.updated_at
    }

    // Set user session
    await setUserSession(event, { user })

    return { user }
  } catch (error: any) {
    if ((error as any).statusCode) {
      throw error
    }
    console.error('Login error:', error)
    throw createError({
      statusCode: 500,
      message: 'Internal server error during login'
    })
  }
})
