import { ref, nextTick, watch } from 'vue'
import { useDebounceFn } from '@vueuse/core'

type LanguageOption = {
  label: string
  value: QuoteLanguage
  autoDetected?: boolean
  confidence?: number
  lowConfidence?: boolean
}

type LanguageDetectionState = {
  code: QuoteLanguage | null
  label: string | null
  confidence: number
  source: 'auto' | 'manual' | null
  lowConfidence: boolean
}

const DEFAULT_LANGUAGE: LanguageOption = { label: 'English', value: 'en' }
const ISO3_TO_LANGUAGE: Record<string, QuoteLanguage> = {
  eng: 'en',
  fra: 'fr',
  lat: 'la',
  spa: 'es',
  deu: 'de',
  ita: 'it',
  por: 'pt',
  rus: 'ru',
  jpn: 'ja',
  cmn: 'zh',
  zho: 'zh'
}

const MIN_CONTENT_LENGTH_FOR_DETECTION = 12
const APPLY_CONFIDENCE_THRESHOLD = 0.35
const LOW_CONFIDENCE_THRESHOLD = 0.55

export function useQuoteForm() {
  const form = ref({
    content: '',
    language: { ...DEFAULT_LANGUAGE },
    selectedAuthor: null as Author | null,
    selectedReference: null as QuoteReference | null
  })

  const languageOptions: LanguageOption[] = [
    { label: 'English', value: 'en' },
    { label: 'French', value: 'fr' },
    { label: 'Latin', value: 'la' },
    { label: 'Spanish', value: 'es' },
    { label: 'German', value: 'de' },
    { label: 'Italian', value: 'it' },
    { label: 'Portuguese', value: 'pt' },
    { label: 'Russian', value: 'ru' },
    { label: 'Japanese', value: 'ja' },
    { label: 'Chinese', value: 'zh' }
  ]

  const languageDetection = ref<LanguageDetectionState>({
    code: null,
    label: null,
    confidence: 0,
    source: null,
    lowConfidence: false
  })

  const languageManuallySelected = ref(false)

  const getLanguageOption = (value: QuoteLanguage) => languageOptions.find(opt => opt.value === value) || { ...DEFAULT_LANGUAGE, value }

  const mapIso3ToLanguageOption = (iso3: string): LanguageOption | null => {
    const iso2 = ISO3_TO_LANGUAGE[iso3]
    if (!iso2) return null
    return getLanguageOption(iso2)
  }

  const clearLanguageDetection = () => {
    languageDetection.value = {
      code: null,
      label: null,
      confidence: 0,
      source: null,
      lowConfidence: false
    }
  }

  const onLanguageSelected = (option: LanguageOption) => {
    if (!option) return
    languageManuallySelected.value = true
    languageDetection.value = {
      code: option.value,
      label: option.label,
      confidence: 1,
      source: 'manual',
      lowConfidence: false
    }
    form.value.language = {
      ...option,
      autoDetected: false,
      confidence: 1,
      lowConfidence: false
    }
  }

  const applyDetectedLanguage = (option: LanguageOption, confidence: number) => {
    const lowConfidence = confidence < LOW_CONFIDENCE_THRESHOLD
    form.value.language = {
      ...option,
      autoDetected: true,
      confidence,
      lowConfidence
    }
    languageDetection.value = {
      code: option.value,
      label: option.label,
      confidence,
      source: 'auto',
      lowConfidence
    }
  }

  const detectLanguage = useDebounceFn(async (text: string) => {
    const content = text.trim()

    if (languageManuallySelected.value) return
    if (content.length < MIN_CONTENT_LENGTH_FOR_DETECTION) {
      clearLanguageDetection()
      return
    }

    try {
      const response = await $fetch<{ language: string; confidence: number }>('/api/detect-language', {
        method: 'POST',
        body: { text: content },
      })

      if (!response || response.language === 'und') {
        clearLanguageDetection()
        return
      }

      const option = mapIso3ToLanguageOption(response.language)
      if (!option) {
        clearLanguageDetection()
        return
      }

      const confidence = response.confidence
      languageDetection.value = {
        code: option.value,
        label: option.label,
        confidence,
        source: 'auto',
        lowConfidence: confidence < LOW_CONFIDENCE_THRESHOLD
      }

      if (confidence >= APPLY_CONFIDENCE_THRESHOLD) {
        applyDetectedLanguage(option, confidence)
      }
    } catch (error) {
      console.error('Language auto-detect failed:', error)
      clearLanguageDetection()
    }
  }, 450)

  watch(() => form.value.content, (text) => {
    void detectLanguage(text || '')
  })

  // Search state
  const authorQuery = ref('')
  const referenceQuery = ref('')
  const authorSuggestions = ref<Author[]>([])
  const referenceSuggestions = ref<QuoteReference[]>([])
  const showAuthorSuggestions = ref(false)
  const showReferenceSuggestions = ref(false)
  const submitting = ref(false)
  const selectedAuthorIndex = ref(-1)
  const selectedReferenceIndex = ref(-1)

  const authorInputRef = ref<any>(null)
  const referenceInputRef = ref<any>(null)
  const authorSuggestionsRef = ref<HTMLElement | null>(null)
  const referenceSuggestionsRef = ref<HTMLElement | null>(null)

  function useSuggestionSearch<T>(config: {
    query: Ref<string>
    suggestions: Ref<T[]>
    endpoint: string
  }) {
    const _search = async (fetcher: typeof $fetch, opts: { limit?: number; minLength?: number } = {}) => {
      const limit = opts.limit ?? 5
      const minLength = opts.minLength ?? 1
      if (!config.query.value.trim() || config.query.value.trim().length < minLength) {
        config.suggestions.value = [] as any
        return
      }
      try {
        const response = await fetcher(config.endpoint, { query: { q: config.query.value, limit } })
        config.suggestions.value = (response as any).data || []
      } catch (error) {
        console.error(`Error searching ${config.endpoint}:`, error)
        config.suggestions.value = [] as any
      }
    }
    return useDebounceFn(_search, 300)
  }

  function useSuggestionNavigation(config: {
    show: Ref<boolean>
    suggestions: Ref<any[]>
    query: Ref<string>
    selectedIndex: Ref<number>
    suggestionsRef: Ref<HTMLElement | null>
    inputRef: Ref<any>
    select: (item: any) => void
    createNew: () => void
    scrollToItem: () => void
  }) {
    const handleInputFocus = () => {
      config.show.value = true
      config.selectedIndex.value = -1
    }

    const handleInputBlur = (event: FocusEvent) => {
      const relatedTarget = event.relatedTarget as HTMLElement
      if (relatedTarget && config.suggestionsRef.value?.contains(relatedTarget)) return
      setTimeout(() => {
        config.show.value = false
        config.selectedIndex.value = -1
      }, 150)
    }

    const handleSuggestionsBlur = (event: FocusEvent) => {
      const relatedTarget = event.relatedTarget as HTMLElement
      if (relatedTarget && config.inputRef.value?.$el?.contains(relatedTarget)) return
      setTimeout(() => {
        config.show.value = false
        config.selectedIndex.value = -1
      }, 150)
    }

    const handleKeydown = (event: KeyboardEvent) => {
      if (!config.show.value) return
      const hasCreateOption = config.query.value && !config.suggestions.value.some((s: any) => s.name.toLowerCase() === config.query.value.toLowerCase())
      const totalItems = config.suggestions.value.length + (hasCreateOption ? 1 : 0)

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault()
          config.selectedIndex.value = config.selectedIndex.value < totalItems - 1 ? config.selectedIndex.value + 1 : 0
          config.scrollToItem()
          break
        case 'ArrowUp':
          event.preventDefault()
          config.selectedIndex.value = config.selectedIndex.value > 0 ? config.selectedIndex.value - 1 : totalItems - 1
          config.scrollToItem()
          break
        case 'Enter':
          event.preventDefault()
          if (config.selectedIndex.value >= 0) {
            if (config.selectedIndex.value < config.suggestions.value.length) {
              const candidate = config.suggestions.value[config.selectedIndex.value]
              if (candidate) config.select(candidate)
            } else {
              config.createNew()
            }
          }
          break
        case 'Escape':
          event.preventDefault()
          config.show.value = false
          config.selectedIndex.value = -1
          config.inputRef.value?.$el?.focus()
          break
      }
    }

    return { handleInputFocus, handleInputBlur, handleSuggestionsBlur, handleKeydown }
  }

  const searchAuthors = useSuggestionSearch({
    query: authorQuery,
    suggestions: authorSuggestions,
    endpoint: '/api/authors/search',
  })

  const searchReferences = useSuggestionSearch({
    query: referenceQuery,
    suggestions: referenceSuggestions,
    endpoint: '/api/references/search',
  })

  const selectAuthor = (author: Author) => {
    form.value.selectedAuthor = author
    authorQuery.value = author.name
    showAuthorSuggestions.value = false
    selectedAuthorIndex.value = -1
  }

  const selectReference = (ref: QuoteReference) => {
    form.value.selectedReference = ref
    referenceQuery.value = ref.name
    showReferenceSuggestions.value = false
    selectedReferenceIndex.value = -1
  }

  const createNewAuthor = () => {
    form.value.selectedAuthor = {
      id: 0,
      name: authorQuery.value,
      is_fictional: false,
      birth_date: undefined,
      birth_location: undefined,
      death_date: undefined,
      death_location: undefined,
      job: undefined,
      description: undefined,
      image_url: undefined,
      socials: '{}',
      views_count: 0,
      likes_count: 0,
      shares_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    } as unknown as Author
    showAuthorSuggestions.value = false
    selectedAuthorIndex.value = -1
  }

  const createNewReference = () => {
    form.value.selectedReference = {
      id: 0,
      name: referenceQuery.value,
      original_language: form.value.language.value as QuoteLanguage,
      release_date: null,
      description: null,
      primary_type: 'other',
      secondary_type: null,
      image_url: undefined,
      urls: '{}',
      views_count: 0,
      likes_count: 0,
      shares_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    } as unknown as QuoteReference
    showReferenceSuggestions.value = false
    selectedReferenceIndex.value = -1
  }

  const authorNav = useSuggestionNavigation({
    show: showAuthorSuggestions,
    suggestions: authorSuggestions,
    query: authorQuery,
    selectedIndex: selectedAuthorIndex,
    suggestionsRef: authorSuggestionsRef,
    inputRef: authorInputRef,
    select: selectAuthor,
    createNew: createNewAuthor,
    scrollToItem: () => {
      nextTick(() => {
        if (selectedAuthorIndex.value >= 0 && authorSuggestionsRef.value) {
          const items = (authorSuggestionsRef.value as HTMLElement).children
          const selectedItem = items[selectedAuthorIndex.value]
          if (selectedItem) selectedItem.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
        }
      })
    },
  })

  const referenceNav = useSuggestionNavigation({
    show: showReferenceSuggestions,
    suggestions: referenceSuggestions,
    query: referenceQuery,
    selectedIndex: selectedReferenceIndex,
    suggestionsRef: referenceSuggestionsRef,
    inputRef: referenceInputRef,
    select: selectReference,
    createNew: createNewReference,
    scrollToItem: () => {
      nextTick(() => {
        if (selectedReferenceIndex.value >= 0 && referenceSuggestionsRef.value) {
          const items = (referenceSuggestionsRef.value as HTMLElement).children
          const selectedItem = items[selectedReferenceIndex.value]
          if (selectedItem) selectedItem.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
        }
      })
    },
  })

  const clearAuthor = () => {
    form.value.selectedAuthor = null
    authorQuery.value = ''
    selectedAuthorIndex.value = -1
  }

  const clearReference = () => {
    form.value.selectedReference = null
    referenceQuery.value = ''
    selectedReferenceIndex.value = -1
  }

  const resetForm = () => {
    form.value = {
      content: '',
      language: { ...DEFAULT_LANGUAGE },
      selectedAuthor: null,
      selectedReference: null
    }
    languageManuallySelected.value = false
    clearLanguageDetection()
    authorQuery.value = ''
    referenceQuery.value = ''
    authorSuggestions.value = []
    referenceSuggestions.value = []
    selectedAuthorIndex.value = -1
    selectedReferenceIndex.value = -1
  }

  const initializeFormForEdit = (editQuote?: QuoteWithRelations | AdminQuote | null) => {
    if (!editQuote) return
    const quote: any = editQuote
    form.value.content = quote.name || ''
    const languageOption = languageOptions.find(opt => opt.value === quote.language)
    form.value.language = languageOption || { ...DEFAULT_LANGUAGE }
    languageManuallySelected.value = true
    languageDetection.value = {
      code: form.value.language.value as QuoteLanguage,
      label: form.value.language.label,
      confidence: 1,
      source: 'manual',
      lowConfidence: false
    }

    form.value.selectedAuthor = null
    form.value.selectedReference = null
    authorQuery.value = ''
    referenceQuery.value = ''

    if (quote.author) {
      form.value.selectedAuthor = quote.author as Author
      authorQuery.value = quote.author.name || ''
    } else if (quote.author_id && quote.author_name) {
      form.value.selectedAuthor = {
        id: quote.author_id,
        name: quote.author_name,
        is_fictional: !!quote.author_is_fictional,
        job: null,
        description: null,
        image_url: quote.author_image_url || undefined,
        socials: '{}',
        views_count: 0,
        likes_count: 0,
        shares_count: 0,
        created_at: quote.created_at || new Date().toISOString(),
        updated_at: quote.updated_at || new Date().toISOString()
      } as unknown as Author
      authorQuery.value = quote.author_name
    }

    if (quote.reference) {
      form.value.selectedReference = quote.reference as QuoteReference
      referenceQuery.value = quote.reference.name || ''
    } else if (quote.reference_id && quote.reference_name) {
      form.value.selectedReference = {
        id: quote.reference_id,
        name: quote.reference_name,
        original_language: quote.language || form.value.language.value,
        release_date: null,
        description: null,
        primary_type: quote.reference_type || 'other',
        secondary_type: quote.reference_secondary_type || null,
        image_url: undefined,
        urls: '{}',
        views_count: 0,
        likes_count: 0,
        shares_count: 0,
        created_at: quote.created_at || new Date().toISOString(),
        updated_at: quote.updated_at || new Date().toISOString()
      } as unknown as QuoteReference
      referenceQuery.value = quote.reference_name
    }
  }

  const scrollToSelectedAuthorItem = () => {
    nextTick(() => {
      if (selectedAuthorIndex.value >= 0 && authorSuggestionsRef.value) {
        const items = (authorSuggestionsRef.value as HTMLElement).children
        const selectedItem = items[selectedAuthorIndex.value]
        if (selectedItem) selectedItem.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
      }
    })
  }

  const scrollToSelectedReferenceItem = () => {
    nextTick(() => {
      if (selectedReferenceIndex.value >= 0 && referenceSuggestionsRef.value) {
        const items = (referenceSuggestionsRef.value as HTMLElement).children
        const selectedItem = items[selectedReferenceIndex.value]
        if (selectedItem) selectedItem.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
      }
    })
  }

  const createPayload = (user: any): CreateQuoteData => {
    return {
      name: form.value.content.trim(),
      language: form.value.language.value as QuoteLanguage,
      author_id: form.value.selectedAuthor?.id,
      reference_id: form.value.selectedReference?.id,
      new_author: form.value.selectedAuthor?.id === 0 ? { name: form.value.selectedAuthor.name, is_fictional: false } : undefined,
      new_reference: form.value.selectedReference?.id === 0 ? { name: form.value.selectedReference.name, original_language: form.value.language.value as QuoteLanguage, primary_type: 'other' as const } : undefined,
      user_id: user?.id || -1
    }
  }

  return {
    // state
    form,
    languageOptions,
    languageDetection,
    languageManuallySelected,
    authorQuery,
    referenceQuery,
    authorSuggestions,
    referenceSuggestions,
    showAuthorSuggestions,
    showReferenceSuggestions,
    submitting,
    selectedAuthorIndex,
    selectedReferenceIndex,

    // template refs
    authorInputRef,
    referenceInputRef,
    authorSuggestionsRef,
    referenceSuggestionsRef,

    // search (network)
    searchAuthors,
    searchReferences,
    onLanguageSelected,

    // focus / blur / keyboard handlers (authors)
    handleAuthorInputFocus: authorNav.handleInputFocus,
    handleAuthorInputBlur: authorNav.handleInputBlur,
    handleAuthorSuggestionsBlur: authorNav.handleSuggestionsBlur,
    handleAuthorKeydown: authorNav.handleKeydown,

    // focus / blur / keyboard handlers (references)
    handleReferenceInputFocus: referenceNav.handleInputFocus,
    handleReferenceInputBlur: referenceNav.handleInputBlur,
    handleReferenceSuggestionsBlur: referenceNav.handleSuggestionsBlur,
    handleReferenceKeydown: referenceNav.handleKeydown,

    // selection helpers
    selectAuthor,
    selectReference,
    createNewAuthor,
    createNewReference,
    clearAuthor,
    clearReference,

    // form lifecycle / actions
    resetForm,
    initializeFormForEdit,
    createPayload,
  }
}
