export default defineNuxtRouteMiddleware((to) => {
  // Keep the app header in sync with the current route
  const store = usePageHeaderStore()
  store.setPageHeaderFromRoute(to.path)
})
