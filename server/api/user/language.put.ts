export default defineEventHandler(async (event) => {
  // Check authentication
  const { user } = await getUserSession(event)
  if (!user) {
    throwServer(401, 'Authentication required')
  }

  const body = await readBody(event)
  const { language } = body

  // Validate language
  const validLanguages = ['en', 'fr', 'es', 'de', 'it', 'pt', 'ru', 'ja', 'zh']
  if (!language || !validLanguages.includes(language)) {
    throwServer(400, 'Invalid language. Must be one of: ' + validLanguages.join(', '))
  }

  try {
    const { db, schema } = await import('hub:db')
    const { eq } = await import('drizzle-orm')
    
    // Update user's language preference
    await db.update(schema.users)
      .set({ 
        language: language as any,
        updatedAt: new Date()
      })
      .where(eq(schema.users.id, user.id))

    return {
      success: true,
      data: {
        language,
        message: 'Language preference updated successfully'
      }
    }
  } catch (error: any) {
    if ((error as any).statusCode) {
      throw error
    }
    console.error('Error updating user language:', error)
    throwServer(500, 'Internal server error')
  }
})
