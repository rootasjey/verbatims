export default defineNuxtPlugin(() => {
  const languageStore = useLanguageStore()
  const { syncLocale } = useI18nContentSync()
  const { locale } = useI18nLocale()

  nextTick(async () => {
    await languageStore.initialize()

    const currentLocale = locale.value
    if (currentLocale && languageStore.isAllLanguages) {
      syncLocale(currentLocale)
    }
  })

  watch(locale, (newLocale) => {
    if (newLocale) {
      syncLocale(newLocale)
    }
  })
})
