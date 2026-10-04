export default defineNuxtPlugin(async () => {
  const languageStore = useLanguageStore()
  const { user } = useUserSession()

  // Load the account preference before pages request content with a language filter.
  await languageStore.initialize()

  watch(() => user.value?.id, async (userId, previousUserId) => {
    if (userId && userId !== previousUserId) {
      await languageStore.loadUserPreferences()
    }
  })
})
