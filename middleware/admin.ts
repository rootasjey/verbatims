export default defineNuxtRouteMiddleware((to, from) => {
  const { user } = useUserSession()
  
  if (!user.value) {
    return navigateTo('/login')
  }
  
  if (user.value.role !== 'admin' && user.value.role !== 'moderator') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Access denied. Admin or moderator role required.'
    })
  }
})
