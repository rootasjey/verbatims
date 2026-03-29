import { db, schema } from 'hub:db'
import { eq, sql } from 'drizzle-orm'
import { toISOStringOrNull } from '../../utils/date-normalization'
import { validLanguages } from '../../utils/validation/reference'

export default defineOAuthGitHubEventHandler({
  config: {
    emailRequired: true
  },
  async onSuccess(event, { user, tokens }) {
    try {
      const oauthPasswordHash = await hashPassword(`oauth:github:${user.id}`)

      // Check if user already exists
      let existingUser = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.email, user.email))
        .get()
      
      if (existingUser) {
        // Update existing user
        const updated = await db
          .update(schema.users)
          .set({
            name: user.name || user.login,
            avatarUrl: user.avatar_url,
            lastLoginAt: sql`CURRENT_TIMESTAMP`,
            updatedAt: sql`CURRENT_TIMESTAMP`
          })
          .where(eq(schema.users.id, existingUser.id))
          .returning()
          .get()
        
        existingUser = updated
      } else {
        // Create new user
        existingUser = await db
          .insert(schema.users)
          .values({
            email: user.email,
            name: user.name || user.login,
            password: oauthPasswordHash,
            avatarUrl: user.avatar_url,
            role: 'user',
            isActive: true,
            emailVerified: true,
            lastLoginAt: sql`CURRENT_TIMESTAMP`
          })
          .returning()
          .get()
      }

      const language = (existingUser.language && validLanguages.includes(existingUser.language as any))
        ? (existingUser.language as typeof validLanguages[number])
        : 'en'
      
      // Set user session
      const sessionUser = {
        id: existingUser.id,
        email: existingUser.email,
        name: existingUser.name,
        avatar_url: existingUser.avatarUrl,
        role: existingUser.role,
        is_active: existingUser.isActive,
        email_verified: existingUser.emailVerified,
        language,
        created_at: toISOStringOrNull(existingUser.createdAt),
        updated_at: toISOStringOrNull(existingUser.updatedAt)
      }

      await setUserSession(event, {
        user: sessionUser
      })
      
      return sendRedirect(event, '/dashboard')
    } catch (error) {
      console.error('GitHub OAuth error:', error)
      return sendRedirect(event, '/login?error=oauth_error')
    }
  },
  onError(event, error) {
    console.error('GitHub OAuth error:', error)
    return sendRedirect(event, '/login?error=oauth_error')
  }
})
