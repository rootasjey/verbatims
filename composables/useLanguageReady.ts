/**
 * Composable to wait for language store initialization
 * This ensures data fetching and UI rendering wait for the language store to be ready
 */
export const useLanguageReady = () => {
  const languageStore = useLanguageStore()
  
  // Return a promise that resolves when the store is ready
  const waitForLanguageStore = (): Promise<void> => {
    return new Promise((resolve) => {
      // If already ready, resolve immediately
      if (languageStore.isReady) {
        resolve()
        return
      }

      // If not initialized yet, trigger initialization
      if (!languageStore.isInitialized && !languageStore.isInitializing) {
        languageStore.initialize()
      }

      // Set a timeout to prevent infinite waiting
      const timeout = setTimeout(() => {
        console.warn('Language store initialization timeout, proceeding with default')
        resolve()
      }, 5000) // 5 second timeout

      // Watch for the store to become ready
      const unwatch = watch(
        () => languageStore.isReady,
        (isReady) => {
          if (isReady) {
            clearTimeout(timeout)
            unwatch()
            resolve()
          }
        },
        { immediate: true }
      )
    })
  }
  
  // Reactive computed for template usage
  const isLanguageReady = computed(() => languageStore.isReady)
  const isLanguageInitializing = computed(() => languageStore.isInitializing)
  
  return {
    waitForLanguageStore,
    isLanguageReady,
    isLanguageInitializing
  }
}
