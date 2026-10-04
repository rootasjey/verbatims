export default defineNuxtPlugin(() => {
  const { user } = useUserSession()
  const languageStore = useLanguageStore()
  const preference = user.value?.content_language

  if (preference) {
    const language = languageStore.availableLanguages.find(option => option.value === preference)
    if (language) languageStore.selectedLanguage = language
  }
})
