export default defineNuxtRouteMiddleware((to, from) => {
  const { user } = useUserSession()
  
  if (!user.value) {
    return navigateTo('/auth/signin')
  }
  
  // Check if user is active
  if (!user.value.is_active) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Account is deactivated'
    })
  }
})
