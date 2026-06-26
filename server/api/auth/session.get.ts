export default defineEventHandler(async (event) => {
  try {
    const session = await getUserSession(event)
    return { success: true, data: { user: session.user || null } }
  } catch (error) {
    console.error('Session error:', error)
    return { success: true, data: { user: null } }
  }
})
