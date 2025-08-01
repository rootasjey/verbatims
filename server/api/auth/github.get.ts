export default defineOAuthGitHubEventHandler({
  config: {
    emailRequired: true
  },
  async onSuccess(event, { user, tokens }) {
    try {
      const db = hubDatabase()
      
      // Check if user already exists
      let existingUser = await db.prepare(
        'SELECT * FROM users WHERE email = ?'
      ).bind(user.email).first()
      
      if (existingUser) {
        // Update existing user
        await db.prepare(`
          UPDATE users 
          SET name = ?, avatar_url = ?, last_login_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).bind(user.name || user.login, user.avatar_url, existingUser.id).run()
        
        existingUser.name = user.name || user.login
        existingUser.avatar_url = user.avatar_url
      } else {
        // Create new user
        const result = await db.prepare(`
          INSERT INTO users (email, name, avatar_url, role, is_active, email_verified, last_login_at)
          VALUES (?, ?, ?, 'user', 1, 1, CURRENT_TIMESTAMP)
        `).bind(
          user.email,
          user.name || user.login,
          user.avatar_url
        ).run()
        
        existingUser = {
          id: result.meta.last_row_id,
          email: user.email,
          name: user.name || user.login,
          avatar_url: user.avatar_url,
          role: 'user',
          is_active: true,
          email_verified: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      }
      
      // Set user session
      await setUserSession(event, {
        user: {
          id: existingUser.id,
          email: existingUser.email,
          name: existingUser.name,
          avatar_url: existingUser.avatar_url,
          role: existingUser.role,
          is_active: existingUser.is_active,
          email_verified: existingUser.email_verified
        }
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
