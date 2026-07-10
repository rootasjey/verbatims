export function useI18nContentSync() {
  const languageStore = useLanguageStore()

  function syncLocale(locale: string) {
    const contentValue = locale as string
    if (languageStore.availableLanguages.some(l => l.value === contentValue)) {
      languageStore.setLanguageByValue(contentValue)
    }
  }

  return { syncLocale }
}
