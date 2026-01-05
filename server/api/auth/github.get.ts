import { db, schema } from 'hub:db'
import { eq, sql } from 'drizzle-orm'

export default defineOAuthGitHubEventHandler({
  config: {
    emailRequired: true
  },
  async onSuccess(event, { user, tokens }) {
    try {
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
            avatarUrl: user.avatar_url,
            role: 'user',
            isActive: true,
            emailVerified: true,
            lastLoginAt: sql`CURRENT_TIMESTAMP`
          })
          .returning()
          .get()
      }
      
      // Set user session
      const sessionUser = {
        id: existingUser.id,
        email: existingUser.email,
        name: existingUser.name,
        avatar_url: existingUser.avatarUrl,
        role: existingUser.role,
        is_active: existingUser.isActive,
        email_verified: existingUser.emailVerified,
        language: existingUser.language,
        created_at: existingUser.createdAt,
        updated_at: existingUser.updatedAt
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
