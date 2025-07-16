import { z } from 'zod'

const bodySchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(8),
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, bodySchema.parse)
  const { name, email, password } = body

  try {
    // Check if user already exists
    const existingUser = await hubDatabase()
      .prepare('SELECT id FROM users WHERE email = ?1 OR name = ?2 LIMIT 1')
      .bind(email, name)
      .first()

    if (existingUser) {
      throw createError({
        statusCode: 409,
        message: 'User with this email or name already exists'
      })
    }

    // Hash the password using nuxt-auth-utils
    const hashedPassword = await hashPassword(password)

    // Insert new user
    const result = await hubDatabase()
      .prepare(`
        INSERT INTO users (name, email, password, role)
        VALUES (?1, ?2, ?3, 'user')
      `)
      .bind(name, email, hashedPassword)
      .run()

    if (!result.success) {
      throw createError({
        statusCode: 500,
        message: 'Failed to create user account'
      })
    }

    // Fetch the created user
    const newUser = await hubDatabase()
      .prepare('SELECT * FROM users WHERE id = ?1 LIMIT 1')
      .bind(result.meta.last_row_id)
      .first()

    if (!newUser) {
      throw createError({
        statusCode: 500,
        message: 'Failed to retrieve created user'
      })
    }

    // Set user session
    await setUserSession(event, {
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        createdAt: newUser.created_at,
      }
    })

    return {
      message: 'Account created successfully',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        createdAt: newUser.created_at
      }
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    console.error('Registration error:', error)
    throw createError({
      statusCode: 500,
      message: 'Internal server error during registration'
    })
  }
})
