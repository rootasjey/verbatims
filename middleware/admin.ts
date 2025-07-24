export default defineNuxtRouteMiddleware((to, from) => {
  const { user } = useUserSession()
  console.log('user', user.value)
  
  if (!user.value) {
    return navigateTo('/auth/signin')
  }
  
  // Check if user has admin or moderator role
  if (user.value.role !== 'admin' && user.value.role !== 'moderator') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Access denied. Admin or moderator role required.'
    })
  }
})
