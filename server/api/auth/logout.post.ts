export default defineEventHandler(async (event) => {
  try {
    await clearUserSession(event)
    return { success: true, message: 'Logged out successfully' }
  } catch (error) {
    console.error('Logout error:', error)
    throwServer(500, 'Internal server error during logout')
  }
})
