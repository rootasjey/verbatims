import { z } from 'zod'
import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'
import { verifyPasswordWorker } from '~~/server/utils/password'

const bodySchema = z.object({
  email: z.email(),
  password: z.string().min(8)
})

export default defineEventHandler(async (event) => {
  const { email, password } = await readValidatedBody(event, bodySchema.parse)

  try {
    // Find user by email
    const userData = await db.select().from(schema.users).where(eq(schema.users.email, email)).get()

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
    // const isValidPassword = await verifyPassword(userData.password as string, password)
    // --------------------------------------
    // NOTE: Using custom worker-based verification to avoid nuxt-auth-utils dependency issues in Cloudflare
    const isValidPassword = await verifyPasswordWorker(userData.password, password)

    if (!isValidPassword) {
      throw createError({
        statusCode: 401,
        message: 'Invalid email or password'
      })
    }

    // Update last login timestamp
    await db.update(schema.users)
      .set({ lastLoginAt: new Date() })
      .where(eq(schema.users.id, userData.id))

    // Ensure language is a valid locale and default to 'en' when missing/invalid
    const language = (userData.language && validLanguages.includes(userData.language as any))
      ? (userData.language as typeof validLanguages[number])
      : 'en'

    const user = {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      // createdAt/updatedAt may be Date, numeric timestamp or string — normalize safely
      created_at: userData.createdAt instanceof Date
        ? (isNaN(userData.createdAt.getTime()) ? null : userData.createdAt.toISOString())
        : userData.createdAt,
      avatar_url: userData.avatarUrl,
      biography: userData.biography,
      job: userData.job,
      language,
      location: userData.location,
      socials: userData.socials,
      updated_at: userData.updatedAt instanceof Date
        ? (isNaN(userData.updatedAt.getTime()) ? null : userData.updatedAt.toISOString())
        : userData.updatedAt
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
