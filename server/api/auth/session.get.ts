export default defineEventHandler(async (event) => {
  try {
    const session = await getUserSession(event)
    return { user: session.user || null }
  } catch (error) {
    console.error('Session error:', error)
    return { user: null }
  }
})
