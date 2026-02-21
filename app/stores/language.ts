export interface LanguageOption {
  value: string
  display: string
  icon: string
}

export const useLanguageStore = defineStore('language', () => {
  // State
  const selectedLanguage = ref<LanguageOption>({
    value: 'all',
    display: 'All Languages',
    icon: 'i-openmoji-globe-showing-americas'
  })
  const isInitialized = ref(false)
  const isInitializing = ref(false)

  // Available language options
  const availableLanguages = computed<LanguageOption[]>(() => [
    { value: 'all', display: 'All Languages', icon: 'i-openmoji-globe-showing-americas' },
    { value: 'en', display: 'English', icon: 'i-openmoji-hamburger' },
    { value: 'fr', display: 'French', icon: 'i-openmoji-baguette-bread' },
    { value: 'la', display: 'Latin', icon: 'i-openmoji-classical-building' },
    // Future languages can be added here
    // { value: 'es', display: 'Spanish', icon: 'i-ph-flag' },
    // { value: 'de', display: 'German', icon: 'i-ph-flag' },
    // { value: 'it', display: 'Italian', icon: 'i-ph-flag' },
    // { value: 'pt', display: 'Portuguese', icon: 'i-ph-flag' },
    // { value: 'ru', display: 'Russian', icon: 'i-ph-flag' },
    // { value: 'ja', display: 'Japanese', icon: 'i-ph-flag' },
    // { value: 'zh', display: 'Chinese', icon: 'i-ph-flag' }
  ])

  // Getters
  const currentLanguage = computed(() => selectedLanguage.value)
  const currentLanguageValue = computed(() => selectedLanguage.value.value)
  const isAllLanguages = computed(() => selectedLanguage.value.value === 'all')
  const isReady = computed(() => isInitialized.value && !isInitializing.value)

  // Actions
  async function initialize() {
    if (isInitialized.value || isInitializing.value) return
    isInitializing.value = true

    // Only run on client-side
    if (typeof window === 'undefined') {
      isInitialized.value = true
      isInitializing.value = false
      return
    }

    try {
      // Try to get language from localStorage first
      const storedLanguage = getFromLocalStorage()
      if (storedLanguage) {
        selectedLanguage.value = storedLanguage
      }
      // Note: User preferences will be loaded separately after authentication is ready
      // This prevents circular dependencies during app initialization
    } catch (error) {
      console.error('Failed to initialize language store:', error)
      // Continue with default language if initialization fails
    }

    isInitialized.value = true
    isInitializing.value = false
  }

  async function loadUserPreferences() {
    if (typeof window === 'undefined') return
    try {
      const { user } = useUserSession()
      if (user.value?.language) {
        const userLanguageOption = availableLanguages.value.find(
          lang => lang.value === user.value!.language
        )
        if (userLanguageOption) {
          selectedLanguage.value = userLanguageOption
          // Update localStorage to match user preference
          saveToLocalStorage(userLanguageOption)
        }
      }
    } catch (error) {
      console.error('Failed to load user language preferences:', error)
    }
  }

  async function setLanguage(language: LanguageOption) {
    selectedLanguage.value = language
    saveToLocalStorage(language)
    // If user is authenticated, sync to database
    const { user } = useUserSession()
    if (user.value && language.value !== 'all') {
      try {
        await $fetch('/api/user/language', {
          method: 'PUT',
          body: { language: language.value }
        })
      } catch (error) {
        console.error('Failed to sync language preference to database:', error)
        // Continue anyway - localStorage will persist the choice
      }
    }
  }

  async function setLanguageByValue(value: string) {
    const language = availableLanguages.value.find(lang => lang.value === value)
    if (language) {
      await setLanguage(language)
    }
  }

  function getLanguageQuery(): Record<string, string> {
    if (selectedLanguage.value.value === 'all') {
      return {}
    }
    return { language: selectedLanguage.value.value }
  }

  function saveToLocalStorage(language: LanguageOption) {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('verbatims-language', JSON.stringify(language))
      } catch (error) {
        console.error('Failed to save language to localStorage:', error)
      }
    }
  }

  function getFromLocalStorage(): LanguageOption | null {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('verbatims-language')
        if (stored) {
          const parsed = JSON.parse(stored)
          // Validate that the stored language is still available
          const isValid = availableLanguages.value.some(lang => lang.value === parsed.value)
          return isValid ? parsed : null
        }
      } catch (error) {
        console.error('Failed to load language from localStorage:', error)
      }
    }
    return null
  }

  async function resetToDefault() {
    await setLanguage({
      value: 'all',
      display: 'All Languages',
      icon: 'i-openmoji-globe-showing-americas'
    })
  }

  return {
    // State
    selectedLanguage,
    isInitialized,
    isInitializing,
    
    // Getters
    currentLanguage,
    currentLanguageValue,
    isAllLanguages,
    isReady,
    availableLanguages,
    
    // Actions
    initialize,
    loadUserPreferences,
    setLanguage,
    setLanguageByValue,
    getLanguageQuery,
    saveToLocalStorage,
    getFromLocalStorage,
    resetToDefault
  }
})
