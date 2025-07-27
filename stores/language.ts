import { defineStore } from 'pinia'

export interface LanguageOption {
  value: string
  display: string
  icon: string
}

export interface LanguageState {
  selectedLanguage: LanguageOption
  isInitialized: boolean
  isInitializing: boolean
}

export const useLanguageStore = defineStore('language', {
  state: (): LanguageState => ({
    selectedLanguage: {
      value: 'all',
      display: 'All Languages',
      icon: 'i-openmoji-globe-showing-americas'
    },
    isInitialized: false,
    isInitializing: false
  }),

  getters: {
    currentLanguage: (state) => state.selectedLanguage,
    currentLanguageValue: (state) => state.selectedLanguage.value,
    isAllLanguages: (state) => state.selectedLanguage.value === 'all',
    isReady: (state) => state.isInitialized && !state.isInitializing,
    
    // Available language options
    availableLanguages: (): LanguageOption[] => [
      { value: 'all', display: 'All Languages', icon: 'i-openmoji-globe-showing-americas' },
      { value: 'en', display: 'English', icon: 'i-openmoji-hamburger' },
      { value: 'fr', display: 'French', icon: 'i-openmoji-baguette-bread' },
      // Future languages can be added here
      // { value: 'es', display: 'Spanish', icon: 'i-ph-flag' },
      // { value: 'de', display: 'German', icon: 'i-ph-flag' },
      // { value: 'it', display: 'Italian', icon: 'i-ph-flag' },
      // { value: 'pt', display: 'Portuguese', icon: 'i-ph-flag' },
      // { value: 'ru', display: 'Russian', icon: 'i-ph-flag' },
      // { value: 'ja', display: 'Japanese', icon: 'i-ph-flag' },
      // { value: 'zh', display: 'Chinese', icon: 'i-ph-flag' }
    ]
  },

  actions: {
    // Initialize the store from localStorage and user preferences
    async initialize() {
      if (this.isInitialized || this.isInitializing) return

      this.isInitializing = true

      // Only run on client-side
      if (typeof window === 'undefined') {
        this.isInitialized = true
        this.isInitializing = false
        return
      }

      try {
        // Try to get language from localStorage first
        const storedLanguage = this.getFromLocalStorage()
        if (storedLanguage) {
          this.selectedLanguage = storedLanguage
        }

        // Note: User preferences will be loaded separately after authentication is ready
        // This prevents circular dependencies during app initialization
      } catch (error) {
        console.error('Failed to initialize language store:', error)
        // Continue with default language if initialization fails
      }

      this.isInitialized = true
      this.isInitializing = false
    },

    // Load user preferences from database (called after authentication is ready)
    async loadUserPreferences() {
      if (typeof window === 'undefined') return

      try {
        const { user } = useUserSession()
        if (user.value?.language) {
          const userLanguageOption = this.availableLanguages.find(
            lang => lang.value === user.value!.language
          )
          if (userLanguageOption) {
            this.selectedLanguage = userLanguageOption
            // Update localStorage to match user preference
            this.saveToLocalStorage(userLanguageOption)
          }
        }
      } catch (error) {
        console.error('Failed to load user language preferences:', error)
      }
    },

    // Set the selected language
    async setLanguage(language: LanguageOption) {
      this.selectedLanguage = language
      
      // Save to localStorage
      this.saveToLocalStorage(language)
      
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
    },

    // Set language by value (convenience method)
    async setLanguageByValue(value: string) {
      const language = this.availableLanguages.find(lang => lang.value === value)
      if (language) {
        await this.setLanguage(language)
      }
    },

    // Get language query parameter for API calls
    getLanguageQuery(): Record<string, string> {
      if (this.selectedLanguage.value === 'all') {
        return {}
      }
      return { language: this.selectedLanguage.value }
    },

    // Private methods for localStorage management
    saveToLocalStorage(language: LanguageOption) {
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('verbatims-language', JSON.stringify(language))
        } catch (error) {
          console.error('Failed to save language to localStorage:', error)
        }
      }
    },

    getFromLocalStorage(): LanguageOption | null {
      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem('verbatims-language')
          if (stored) {
            const parsed = JSON.parse(stored)
            // Validate that the stored language is still available
            const isValid = this.availableLanguages.some(lang => lang.value === parsed.value)
            return isValid ? parsed : null
          }
        } catch (error) {
          console.error('Failed to load language from localStorage:', error)
        }
      }
      return null
    },

    // Reset to default language
    async resetToDefault() {
      await this.setLanguage({
        value: 'all',
        display: 'All Languages',
        icon: 'i-openmoji-globe-showing-americas'
      })
    }
  }
})
