import { z } from 'zod'
import { db, schema } from 'hub:db'
import { eq, or } from 'drizzle-orm'
import { toISOStringOrNull } from '../../utils/date-normalization'
import { validLanguages } from '../../utils/validation/reference'
import { sendVerificationEmail } from '../../utils/email'

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
      throwServer(409, 'User with this email or name already exists')
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
      throwServer(500, 'Failed to create user account')
    }

    const user = {
      id: result.id,
      name: result.name,
      email: result.email,
      role: result.role ?? 'user',
      created_at: toISOStringOrNull(result.createdAt) ?? '',
      avatar_url: result.avatarUrl ?? undefined,
      biography: result.biography ?? undefined,
      job: result.job ?? undefined,
      language: (result.language && validLanguages.includes(result.language as any))
        ? (result.language as typeof validLanguages[number])
        : 'en',
      location: result.location ?? undefined,
      socials: result.socials ?? undefined,
      updated_at: toISOStringOrNull(result.updatedAt) ?? ''
    }

    await setUserSession(event, { user })

    // Send email verification (best effort — don't block registration)
    try {
      const verificationToken = crypto.randomUUID()
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
      await db.insert(schema.emailVerificationTokens).values({
        userId: result.id,
        token: verificationToken,
        expiresAt,
      })
      await sendVerificationEmail(event, email, verificationToken)
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError)
    }

    return {
      success: true,
      message: 'Account created successfully',
      data: { user },
    }
  } catch (error: any) {
    if ((error as any).statusCode) {
      throw error
    }
    console.error('Registration error:', error)
    throwServer(500, 'Internal server error during registration')
  }
})
