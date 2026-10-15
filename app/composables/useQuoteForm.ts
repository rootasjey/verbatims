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
    selectedReference: null as QuoteReference | null,
    sourceType: '',
    sourceUrl: '',
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
      const response = await $fetch<
        { language: string; confidence: number },
        '/api/detect-language'
      >('/api/detect-language', {
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
      config.show.value = Boolean(config.query.value.trim())
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
          // Make Enter useful directly from the input: choose the highlighted
          // row when navigating, otherwise the first result (or the create row).
          const itemIndex = config.selectedIndex.value >= 0 ? config.selectedIndex.value : 0
          if (itemIndex < config.suggestions.value.length) {
            const candidate = config.suggestions.value[itemIndex]
            if (candidate) config.select(candidate)
          } else if (hasCreateOption) {
            config.createNew()
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
    authorQuery.value = ''
    authorSuggestions.value = []
    showAuthorSuggestions.value = false
    selectedAuthorIndex.value = -1
  }

  const selectReference = (ref: QuoteReference) => {
    form.value.selectedReference = ref
    referenceQuery.value = ''
    referenceSuggestions.value = []
    showReferenceSuggestions.value = false
    selectedReferenceIndex.value = -1
  }

  const createNewAuthor = () => {
    const name = authorQuery.value
    form.value.selectedAuthor = {
      id: 0,
      name,
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
    authorQuery.value = ''
    authorSuggestions.value = []
    showAuthorSuggestions.value = false
    selectedAuthorIndex.value = -1
  }

  const createNewReference = () => {
    const name = referenceQuery.value
    form.value.selectedReference = {
      id: 0,
      name,
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
    referenceQuery.value = ''
    referenceSuggestions.value = []
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
    authorSuggestions.value = []
    showAuthorSuggestions.value = false
    selectedAuthorIndex.value = -1
  }

  const clearReference = () => {
    form.value.selectedReference = null
    referenceQuery.value = ''
    referenceSuggestions.value = []
    showReferenceSuggestions.value = false
    selectedReferenceIndex.value = -1
  }

  const resetForm = () => {
    form.value = {
      content: '',
      language: { ...DEFAULT_LANGUAGE },
      selectedAuthor: null,
      selectedReference: null,
      sourceType: '',
      sourceUrl: '',
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
    const primaryAttribution = quote.attributions?.find((attribution: any) => attribution.is_primary) ?? quote.attributions?.[0]
    const primarySource = quote.sources?.find((source: any) => source.attribution_id === primaryAttribution?.id && source.is_primary)
      ?? quote.sources?.find((source: any) => source.attribution_id === primaryAttribution?.id)
    form.value.sourceType = primarySource?.source_type || ''
    form.value.sourceUrl = primarySource?.source_url || ''
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
    }

    if (quote.reference) {
      form.value.selectedReference = quote.reference as QuoteReference
      referenceQuery.value = quote.reference.name || ''
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

  const createPayload = (): CreateQuoteData => {
    return {
      name: form.value.content.trim(),
      language: form.value.language.value as QuoteLanguage,
      attributions: [{
        author_id: form.value.selectedAuthor?.id || null,
        reference_id: form.value.selectedReference?.id || null,
        is_primary: true,
      }],
      new_author: form.value.selectedAuthor?.id === 0 ? { name: form.value.selectedAuthor.name, is_fictional: false } : undefined,
      new_reference: form.value.selectedReference?.id === 0 ? { name: form.value.selectedReference.name, original_language: form.value.language.value as QuoteLanguage, primary_type: 'other' as const } : undefined
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
