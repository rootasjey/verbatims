import { db, schema } from 'hub:db'
import { eq, sql } from 'drizzle-orm'

export default defineOAuthGoogleEventHandler({
  config: {
    scope: ['email', 'profile']
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
            name: user.name,
            avatar_url: user.picture,
            last_login_at: sql`CURRENT_TIMESTAMP`,
            updated_at: sql`CURRENT_TIMESTAMP`
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
            name: user.name,
            avatar_url: user.picture,
            role: 'user',
            is_active: true,
            email_verified: true,
            last_login_at: sql`CURRENT_TIMESTAMP`
          })
          .returning()
          .get()
      }
      
      // Set user session
      const sessionUser = {
        id: existingUser.id,
        email: existingUser.email,
        name: existingUser.name,
        avatar_url: existingUser.avatar_url,
        role: existingUser.role,
        is_active: existingUser.is_active,
        email_verified: existingUser.email_verified,
        language: existingUser.language,
        created_at: existingUser.created_at,
        updated_at: existingUser.updated_at
      }

      await setUserSession(event, {
        user: sessionUser
      })
      
      return sendRedirect(event, '/dashboard')
    } catch (error) {
      console.error('Google OAuth error:', error)
      return sendRedirect(event, '/login?error=oauth_error')
    }
  },
  onError(event, error) {
    console.error('Google OAuth error:', error)
    return sendRedirect(event, '/login?error=oauth_error')
  }
})
