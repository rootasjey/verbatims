import { z } from 'zod'
import { db, schema } from 'hub:db'
import { eq, or } from 'drizzle-orm'

const bodySchema = z.object({
  name: z.string().min(2).max(50),
  email: z.email(),
  password: z.string().min(8),
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, bodySchema.parse)
  const { name, email, password } = body

  try {
    // Check if user already exists
    const existingUser = await db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(or(eq(schema.users.email, email), eq(schema.users.name, name)))
      .limit(1)
      .get()

    if (existingUser) {
      throw createError({
        statusCode: 409,
        message: 'User with this email or name already exists'
      })
    }

    // Hash the password using nuxt-auth-utils
    const hashedPassword = await hashPassword(password)

    // Insert new user
    const result = await db
      .insert(schema.users)
      .values({
        name,
        email,
        password: hashedPassword,
        role: 'user'
      })
      .returning()
      .get()

    if (!result) {
      throw createError({
        statusCode: 500,
        message: 'Failed to create user account'
      })
    }

    const user = {
      id: result.id,
      name: result.name,
      email: result.email,
      role: result.role,
      created_at: result.createdAt,
      avatar_url: result.avatarUrl,
      biography: result.biography,
      job: result.job,
      language: result.language,
      location: result.location,
      socials: result.socials,
      updated_at: result.updatedAt
    }

    await setUserSession(event, { user })

    return {
      message: 'Account created successfully',
      user,
    }
  } catch (error: any) {
    if ((error as any).statusCode) {
      throw error
    }
    console.error('Registration error:', error)
    throw createError({
      statusCode: 500,
      message: 'Internal server error during registration'
    })
  }
})
