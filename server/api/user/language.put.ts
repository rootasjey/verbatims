export default defineEventHandler(async (event) => {
  // Check authentication
  const { user } = await getUserSession(event)
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required'
    })
  }

  const body = await readBody(event)
  const { language } = body

  // Validate language
  const validLanguages = ['en', 'fr', 'es', 'de', 'it', 'pt', 'ru', 'ja', 'zh']
  if (!language || !validLanguages.includes(language)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid language. Must be one of: ' + validLanguages.join(', ')
    })
  }

  try {
    const db = hubDatabase()
    
    // Update user's language preference
    const result = await db
      .prepare('UPDATE users SET language = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .bind(language, user.id)
      .run()

    if (!result.success) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to update language preference'
      })
    }

    return {
      success: true,
      data: {
        language,
        message: 'Language preference updated successfully'
      }
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    console.error('Error updating user language:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})
