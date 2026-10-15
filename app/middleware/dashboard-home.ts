export default defineNuxtRouteMiddleware((to) => {
  if (to.path !== '/dashboard') return

  return navigateTo('/dashboard/favourites', { replace: true })
})
