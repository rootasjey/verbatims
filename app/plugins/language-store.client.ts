export default defineNuxtPlugin(() => {
  // Initialize the language store on client-side only (non-blocking)
  const languageStore = useLanguageStore()

  // Initialize the store asynchronously without blocking app startup
  nextTick(() => {
    languageStore.initialize()
  })
})
